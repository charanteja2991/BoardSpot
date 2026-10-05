-- =====================================================================
-- PANORAMA  -  VERIFIED-BOOKING REVIEWS
-- Run AFTER schema.sql, security.sql and security_fixes.sql.
-- Safe to re-run (idempotent). Does not depend on any other feature.
--
-- What this adds
--   * reviews table                 (one review per advertiser per billboard)
--   * rules enforced in the database
--       - only the advertiser of an ACCEPTED booking whose period has ENDED
--         may review, and the server decides billboard / owner / reviewer
--       - reviews are immutable; the owner may add ONE reply; an admin may
--         hide (never delete) a review, with a mandatory reason
--       - an owner cannot cancel an accepted booking after it has ended
--         (otherwise they could block the review)
--   * public_reviews view           (no reviewer id, hidden reviews removed)
--   * billboard_review_stats / owner_review_stats views
--
-- Reviews cannot be deleted by anyone from the browser (no DELETE policy).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. MODERATORS  (who may hide a review)
-- ---------------------------------------------------------------------
-- A tiny admins list. No policies on purpose: the browser can never read or
-- write it. The app asks is_admin() whether the signed-in user is a moderator.
CREATE TABLE IF NOT EXISTS public.admins (
    user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admins FROM anon, authenticated;

DO $do$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        EXECUTE $f$
            CREATE FUNCTION public.is_admin() RETURNS boolean
            LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
            AS 'SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())'
        $f$;
    END IF;
END
$do$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Make yourself a moderator (run once, with your own email):
--   INSERT INTO public.admins (user_id)
--   SELECT id FROM auth.users WHERE email = 'you@example.com'
--   ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        uuid NOT NULL UNIQUE
                           REFERENCES public.booking_requests(id) ON DELETE CASCADE,
    billboard_id      uuid NOT NULL
                           REFERENCES public.billboards(id) ON DELETE CASCADE,
    owner_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    rating            smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),

    -- Structured checks that mirror what advertisers told us hurts most.
    -- NULL = "not answered".
    location_matched  boolean,
    photos_accurate   boolean,
    owner_responsive  boolean,

    comment           text CHECK (comment IS NULL OR char_length(comment) <= 500),

    owner_reply       text CHECK (owner_reply IS NULL OR char_length(owner_reply) <= 500),
    owner_replied_at  timestamptz,

    is_hidden         boolean NOT NULL DEFAULT false,
    hidden_reason     text CHECK (hidden_reason IS NULL OR char_length(hidden_reason) <= 500),
    hidden_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    hidden_at         timestamptz,

    created_at        timestamptz NOT NULL DEFAULT now(),

    -- one review per advertiser per billboard (stops review inflation
    -- through many tiny bookings)
    UNIQUE (reviewer_id, billboard_id),
    -- a hidden review always carries a reason
    CHECK (NOT is_hidden OR btrim(coalesce(hidden_reason, '')) <> '')
);

CREATE INDEX IF NOT EXISTS idx_reviews_billboard
ON public.reviews (billboard_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_owner
ON public.reviews (owner_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reviews FROM anon;

-- The public reads reviews through public_reviews (section 4), not this
-- table. Here: the reviewer, the owner being reviewed, and admins.
DROP POLICY IF EXISTS "reviews_select_involved" ON public.reviews;
CREATE POLICY "reviews_select_involved"
ON public.reviews FOR SELECT TO authenticated
USING (reviewer_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_owner" ON public.reviews;
CREATE POLICY "reviews_update_owner"
ON public.reviews FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_admin" ON public.reviews;
CREATE POLICY "reviews_update_admin"
ON public.reviews FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- No DELETE policy on purpose: reviews are kept; admins hide, never delete.


-- ---------------------------------------------------------------------
-- 2. RULES: INSERT
-- ---------------------------------------------------------------------
-- The client sends booking_id, rating, the three checks and a comment.
-- billboard_id / owner_id / reviewer_id are copied from the booking, so
-- they cannot be spoofed (BEFORE triggers run before the RLS WITH CHECK).
-- Trusted callers (SQL editor / service role, auth.uid() IS NULL) skip the
-- eligibility checks so demo data can be seeded.
CREATE OR REPLACE FUNCTION public.enforce_review_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid      uuid := auth.uid();
    b        public.booking_requests%ROWTYPE;
    bb_owner uuid;
BEGIN
    SELECT * INTO b FROM public.booking_requests WHERE id = NEW.booking_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = '23503';
    END IF;

    IF uid IS NOT NULL THEN
        IF b.advertiser_id <> uid THEN
            RAISE EXCEPTION 'You can only review your own bookings.' USING ERRCODE = '42501';
        END IF;
        IF b.status <> 'accepted' THEN
            RAISE EXCEPTION 'Only accepted bookings can be reviewed.' USING ERRCODE = '42501';
        END IF;
        IF b.end_date >= current_date THEN
            RAISE EXCEPTION 'You can review this billboard once the booking period has ended.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT owner_id INTO bb_owner FROM public.billboards WHERE id = b.billboard_id;

    NEW.billboard_id := b.billboard_id;
    NEW.owner_id     := bb_owner;
    NEW.reviewer_id  := b.advertiser_id;

    IF EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.reviewer_id = NEW.reviewer_id AND r.billboard_id = NEW.billboard_id
    ) THEN
        RAISE EXCEPTION 'You have already reviewed this billboard.' USING ERRCODE = '23505';
    END IF;

    NEW.comment := nullif(btrim(coalesce(NEW.comment, '')), '');

    IF uid IS NOT NULL THEN
        NEW.owner_reply      := NULL;
        NEW.owner_replied_at := NULL;
        NEW.is_hidden        := false;
        NEW.hidden_reason    := NULL;
        NEW.hidden_by        := NULL;
        NEW.hidden_at        := NULL;
        NEW.created_at       := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_insert ON public.reviews;
CREATE TRIGGER trg_review_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_insert();


-- ---------------------------------------------------------------------
-- 3. RULES: UPDATE
-- ---------------------------------------------------------------------
--   * the review itself (rating, checks, comment, who, when) is immutable
--   * reviewer : cannot edit
--   * owner    : may add ONE reply, nothing else
--   * admin    : may hide / unhide with a reason, nothing else; an admin
--                cannot moderate a review of their own billboard (treated as
--                the owner: reply only) or one they wrote (same idea as
--                "no self-approval")
--   * trusted callers (auth.uid() IS NULL) bypass
CREATE OR REPLACE FUNCTION public.enforce_review_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
BEGIN
    IF uid IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.id               IS DISTINCT FROM OLD.id
    OR NEW.booking_id       IS DISTINCT FROM OLD.booking_id
    OR NEW.billboard_id     IS DISTINCT FROM OLD.billboard_id
    OR NEW.owner_id         IS DISTINCT FROM OLD.owner_id
    OR NEW.reviewer_id      IS DISTINCT FROM OLD.reviewer_id
    OR NEW.rating           IS DISTINCT FROM OLD.rating
    OR NEW.location_matched IS DISTINCT FROM OLD.location_matched
    OR NEW.photos_accurate  IS DISTINCT FROM OLD.photos_accurate
    OR NEW.owner_responsive IS DISTINCT FROM OLD.owner_responsive
    OR NEW.comment          IS DISTINCT FROM OLD.comment
    OR NEW.created_at       IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'A submitted review cannot be edited.' USING ERRCODE = '42501';
    END IF;

    -- ---------- owner replying ----------
    IF uid = OLD.owner_id THEN
        IF NEW.is_hidden     IS DISTINCT FROM OLD.is_hidden
        OR NEW.hidden_reason IS DISTINCT FROM OLD.hidden_reason
        OR NEW.hidden_by     IS DISTINCT FROM OLD.hidden_by
        OR NEW.hidden_at     IS DISTINCT FROM OLD.hidden_at THEN
            RAISE EXCEPTION 'Owners cannot hide reviews. Contact support to report one.'
                USING ERRCODE = '42501';
        END IF;

        IF OLD.owner_reply IS NOT NULL THEN
            RAISE EXCEPTION 'You have already replied to this review.' USING ERRCODE = '42501';
        END IF;

        NEW.owner_reply := nullif(btrim(coalesce(NEW.owner_reply, '')), '');
        IF NEW.owner_reply IS NULL THEN
            RAISE EXCEPTION 'Please write a reply.' USING ERRCODE = '23514';
        END IF;

        NEW.owner_replied_at := now();
        RETURN NEW;
    END IF;

    -- ---------- admin moderation ----------
    IF public.is_admin() AND uid <> OLD.reviewer_id THEN
        IF NEW.owner_reply      IS DISTINCT FROM OLD.owner_reply
        OR NEW.owner_replied_at IS DISTINCT FROM OLD.owner_replied_at THEN
            RAISE EXCEPTION 'Reviewers cannot edit an owner reply.' USING ERRCODE = '42501';
        END IF;

        IF NEW.is_hidden THEN
            NEW.hidden_reason := nullif(btrim(coalesce(NEW.hidden_reason, '')), '');
            IF NEW.hidden_reason IS NULL THEN
                RAISE EXCEPTION 'Please give a reason for hiding a review.' USING ERRCODE = '23514';
            END IF;
            NEW.hidden_by := uid;
            NEW.hidden_at := now();
        ELSE
            NEW.hidden_reason := NULL;
            NEW.hidden_by     := NULL;
            NEW.hidden_at     := NULL;
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed.' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_review_update ON public.reviews;
CREATE TRIGGER trg_review_update
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_update();


-- An owner must not be able to dodge a review by cancelling a booking that
-- has already ended.
CREATE OR REPLACE FUNCTION public.block_cancel_after_end()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL
       AND OLD.status = 'accepted' AND NEW.status = 'cancelled'
       AND OLD.end_date < current_date THEN
        RAISE EXCEPTION 'This booking has already ended and can no longer be cancelled.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_no_cancel_after_end ON public.booking_requests;
CREATE TRIGGER trg_booking_no_cancel_after_end
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.block_cancel_after_end();


-- ---------------------------------------------------------------------
-- 4. PUBLIC VIEWS
-- ---------------------------------------------------------------------
-- Exposes: first name + last initial, never the reviewer id, phone or
-- email. Hidden reviews are removed. The view runs with its owner's
-- rights (like public_owner_profiles), so it works for anon visitors.
DROP VIEW IF EXISTS public.public_reviews;
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT
    r.id,
    r.billboard_id,
    bb.title AS billboard_title,
    r.owner_id,
    r.rating,
    r.location_matched,
    r.photos_accurate,
    r.owner_responsive,
    r.comment,
    r.owner_reply,
    r.owner_replied_at,
    r.created_at,
    b.end_date AS campaign_ended,
    CASE
        WHEN btrim(coalesce(p.full_name, '')) = '' THEN 'Advertiser'
        ELSE split_part(btrim(p.full_name), ' ', 1)
             || CASE
                    WHEN position(' ' IN btrim(p.full_name)) > 0
                    THEN ' ' || upper(left(regexp_replace(btrim(p.full_name), '^.*\s', ''), 1)) || '.'
                    ELSE ''
                END
    END AS reviewer_name
FROM public.reviews r
JOIN public.booking_requests b ON b.id = r.booking_id
JOIN public.billboards bb      ON bb.id = r.billboard_id
LEFT JOIN public.profiles p    ON p.id = r.reviewer_id
WHERE NOT r.is_hidden;

REVOKE ALL ON public.public_reviews FROM PUBLIC;
GRANT SELECT ON public.public_reviews TO anon, authenticated;

CREATE OR REPLACE VIEW public.billboard_review_stats AS
SELECT
    billboard_id,
    count(*)::int                                   AS review_count,
    round(avg(rating)::numeric, 1)                  AS avg_rating,
    round(100.0 * count(*) FILTER (WHERE location_matched)
          / nullif(count(location_matched), 0))     AS location_matched_pct,
    round(100.0 * count(*) FILTER (WHERE photos_accurate)
          / nullif(count(photos_accurate), 0))      AS photos_accurate_pct,
    round(100.0 * count(*) FILTER (WHERE owner_responsive)
          / nullif(count(owner_responsive), 0))     AS owner_responsive_pct
FROM public.reviews
WHERE NOT is_hidden
GROUP BY billboard_id;

REVOKE ALL ON public.billboard_review_stats FROM PUBLIC;
GRANT SELECT ON public.billboard_review_stats TO anon, authenticated;

CREATE OR REPLACE VIEW public.owner_review_stats AS
SELECT
    owner_id,
    count(*)::int                  AS review_count,
    round(avg(rating)::numeric, 1) AS avg_rating
FROM public.reviews
WHERE NOT is_hidden
GROUP BY owner_id;

REVOKE ALL ON public.owner_review_stats FROM PUBLIC;
GRANT SELECT ON public.owner_review_stats TO anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. OPTIONAL DEMO DATA  (run in the SQL editor, AFTER you have accounts)
-- ---------------------------------------------------------------------
-- Creates one finished, accepted booking and a review on the first
-- published billboard so the reviews UI is not empty in a demo.
-- Replace the email with an existing ADVERTISER account.
--
--   WITH adv AS (SELECT id FROM auth.users WHERE email = 'advertiser@example.com'),
--        bb  AS (SELECT id, owner_id FROM public.billboards
--                WHERE status = 'published' AND owner_id IS NOT NULL LIMIT 1),
--        bk  AS (
--          INSERT INTO public.booking_requests
--                 (billboard_id, advertiser_id, owner_id, start_date, end_date, status, message)
--          SELECT bb.id, adv.id, bb.owner_id,
--                 current_date - 40, current_date - 10, 'accepted', 'Demo booking'
--          FROM bb, adv
--          RETURNING id)
--   INSERT INTO public.reviews
--          (booking_id, rating, location_matched, photos_accurate, owner_responsive, comment)
--   SELECT bk.id, 5, true, true, true,
--          'Location matched the listing and the owner replied within a day.'
--   FROM bk;


-- ---------------------------------------------------------------------
-- QUICK TESTS
-- ---------------------------------------------------------------------
-- a) Advertiser reviews a booking that is still pending / not yet ended
--      -> ERROR "Only accepted bookings..." / "...once the booking period has ended"
-- b) Advertiser reviews someone else's booking -> ERROR "only review your own"
-- c) Same advertiser reviews the same billboard twice -> ERROR "already reviewed"
-- d) Client sends a different owner_id / billboard_id -> ignored (copied from booking)
-- e) Advertiser edits their review -> ERROR "cannot be edited"
-- f) Owner replies once -> OK; a second reply -> ERROR
-- g) Owner tries to set is_hidden = true -> ERROR
-- h) Admin (another account) hides with no reason -> ERROR; with reason -> disappears
--    from public_reviews and from the stats
-- i) Admin who owns the billboard tries to hide a review of it
--      -> ERROR "Owners cannot hide reviews" (they may only reply)
-- j) Owner cancels an accepted booking whose end_date has passed -> ERROR
-- k) As anon: SELECT * FROM public_reviews
--      -> no reviewer_id; first name + initial only
-- l) As anon: SELECT * FROM reviews -> permission denied
