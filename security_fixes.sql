-- =====================================================================
-- PANORAMA / BILLBOARD  -  SECURITY & BOOKING-INTEGRITY FIXES
-- Run AFTER schema.sql and security.sql. Safe to re-run (idempotent).
--
-- Fixes
--   1. Advertiser could approve their own booking (open UPDATE policy)
--   2. Owner spoofing on INSERT (policy compared a column with itself)
--   3. Owner phone numbers readable by anyone (profiles exposed fully)
--   4. No overlap protection: two accepted bookings for the same dates
--   5. Users could change their own role freely
--
-- Run this in the Supabase SQL editor (runs as postgres, so the
-- triggers below treat it as a trusted caller: auth.uid() IS NULL).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. PRE-FLIGHT: existing data that would violate the new rules
-- ---------------------------------------------------------------------
-- Run this SELECT first. It must return 0 rows, otherwise step 4's
-- exclusion constraint will fail. Fix or reject the listed rows, then
-- continue.
--
--   SELECT a.id AS booking_a, b.id AS booking_b, a.billboard_id
--   FROM public.booking_requests a
--   JOIN public.booking_requests b
--     ON a.billboard_id = b.billboard_id AND a.id < b.id
--    AND a.status = 'accepted' AND b.status = 'accepted'
--    AND daterange(a.start_date, a.end_date, '[]')
--        && daterange(b.start_date, b.end_date, '[]');


-- ---------------------------------------------------------------------
-- 1. BOOKING UPDATES: enforce a real state machine
-- ---------------------------------------------------------------------
-- RLS decides WHO may touch a row; it cannot restrict WHICH columns or
-- WHICH status transitions. A trigger does that.
--
-- Allowed transitions
--   owner       : pending  -> accepted | rejected
--                 accepted -> cancelled
--   advertiser  : pending  -> cancelled
--                 accepted -> cancelled
--   rejected / cancelled are final.
-- Everything except `status` (and updated_at) is immutable after insert.

CREATE OR REPLACE FUNCTION public.enforce_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
BEGIN
    -- Trusted callers (SQL editor, service role) bypass the rules.
    IF uid IS NULL THEN
        NEW.updated_at := now();
        RETURN NEW;
    END IF;

    -- Immutable columns
    IF NEW.billboard_id   IS DISTINCT FROM OLD.billboard_id
    OR NEW.advertiser_id  IS DISTINCT FROM OLD.advertiser_id
    OR NEW.owner_id       IS DISTINCT FROM OLD.owner_id
    OR NEW.start_date     IS DISTINCT FROM OLD.start_date
    OR NEW.end_date       IS DISTINCT FROM OLD.end_date
    OR NEW.message        IS DISTINCT FROM OLD.message
    OR NEW.created_at     IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Only the status of a booking request can be changed.'
            USING ERRCODE = '42501';
    END IF;

    -- No status change: allow (e.g. touching updated_at)
    IF NEW.status = OLD.status THEN
        NEW.updated_at := now();
        RETURN NEW;
    END IF;

    IF uid = OLD.owner_id THEN
        IF NOT (
            (OLD.status = 'pending'  AND NEW.status IN ('accepted', 'rejected'))
         OR (OLD.status = 'accepted' AND NEW.status = 'cancelled')
        ) THEN
            RAISE EXCEPTION 'Owners cannot change a request from % to %.', OLD.status, NEW.status
                USING ERRCODE = '42501';
        END IF;

    ELSIF uid = OLD.advertiser_id THEN
        IF NOT (
            OLD.status IN ('pending', 'accepted') AND NEW.status = 'cancelled'
        ) THEN
            RAISE EXCEPTION 'Advertisers can only cancel their own requests.'
                USING ERRCODE = '42501';
        END IF;

    ELSE
        RAISE EXCEPTION 'Not allowed.' USING ERRCODE = '42501';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_update ON public.booking_requests;
CREATE TRIGGER trg_booking_update
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_update();


-- ---------------------------------------------------------------------
-- 2. BOOKING INSERTS: server decides owner/status, validates the rest
-- ---------------------------------------------------------------------
-- The client no longer decides who the owner is. The trigger copies
-- owner_id from the billboard, forces status = 'pending', blocks
-- booking your own board, and rejects dates that overlap an already
-- accepted booking (instant feedback; step 4 is the hard guarantee).
-- BEFORE triggers run before RLS WITH CHECK, so the corrected owner_id
-- is what the policy sees.

CREATE OR REPLACE FUNCTION public.enforce_booking_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    b public.billboards%ROWTYPE;
BEGIN
    SELECT * INTO b FROM public.billboards WHERE id = NEW.billboard_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Billboard not found.' USING ERRCODE = '23503';
    END IF;

    -- Server is the source of truth for ownership and status
    NEW.owner_id := b.owner_id;
    NEW.status   := 'pending';

    IF NEW.advertiser_id = b.owner_id THEN
        RAISE EXCEPTION 'You cannot book your own billboard.' USING ERRCODE = '42501';
    END IF;

    IF b.status <> 'published' THEN
        RAISE EXCEPTION 'This billboard is not available for booking.' USING ERRCODE = '42501';
    END IF;

    IF (b.available_from IS NOT NULL AND NEW.start_date < b.available_from)
    OR (b.available_to   IS NOT NULL AND NEW.end_date   > b.available_to) THEN
        RAISE EXCEPTION 'The requested dates are outside this billboard''s availability window.'
            USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.booking_requests r
        WHERE r.billboard_id = NEW.billboard_id
          AND r.status = 'accepted'
          AND daterange(r.start_date, r.end_date, '[]')
              && daterange(NEW.start_date, NEW.end_date, '[]')
    ) THEN
        RAISE EXCEPTION 'Those dates are already booked. Please choose different dates.'
            USING ERRCODE = '23P01';
    END IF;

    -- Stop request spam: one open request per advertiser/billboard/dates
    IF EXISTS (
        SELECT 1
        FROM public.booking_requests r
        WHERE r.billboard_id  = NEW.billboard_id
          AND r.advertiser_id = NEW.advertiser_id
          AND r.status = 'pending'
          AND r.start_date = NEW.start_date
          AND r.end_date   = NEW.end_date
    ) THEN
        RAISE EXCEPTION 'You already have a pending request for these dates.'
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_insert ON public.booking_requests;
CREATE TRIGGER trg_booking_insert
BEFORE INSERT ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_insert();


-- Corrected INSERT policy (the old one compared b.owner_id with itself).
DROP POLICY IF EXISTS "advertisers_insert_requests" ON public.booking_requests;
CREATE POLICY "advertisers_insert_requests"
ON public.booking_requests
FOR INSERT
TO authenticated
WITH CHECK (
    advertiser_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
        SELECT 1
        FROM public.billboards b
        WHERE b.id = booking_requests.billboard_id
          AND b.status = 'published'
          AND b.owner_id = booking_requests.owner_id      -- fixed
          AND b.owner_id <> auth.uid()
          AND (b.available_from IS NULL OR booking_requests.start_date >= b.available_from)
          AND (b.available_to   IS NULL OR booking_requests.end_date   <= b.available_to)
    )
);

-- Corrected UPDATE policy: participants only, and the row must still
-- belong to them afterwards (column/transition rules live in the trigger).
DROP POLICY IF EXISTS "participants_update_requests" ON public.booking_requests;
CREATE POLICY "participants_update_requests"
ON public.booking_requests
FOR UPDATE
TO authenticated
USING (advertiser_id = auth.uid() OR owner_id = auth.uid())
WITH CHECK (advertiser_id = auth.uid() OR owner_id = auth.uid());


-- ---------------------------------------------------------------------
-- 3. PROFILES: stop exposing phone numbers and other private fields
-- ---------------------------------------------------------------------
-- Remove the policy that let anyone SELECT every column of every owner.
DROP POLICY IF EXISTS "public_view_owner_profiles" ON public.profiles;

-- Public, minimal view: id, name, avatar of owners only.
-- (Deliberately runs with the view owner's rights so it can read
--  profiles despite RLS. It only ever exposes these three columns.)
CREATE OR REPLACE VIEW public.public_owner_profiles AS
SELECT id, full_name, avatar_url
FROM public.profiles
WHERE role = 'owner';

REVOKE ALL ON public.public_owner_profiles FROM PUBLIC;
GRANT SELECT ON public.public_owner_profiles TO anon, authenticated;

-- Owners may see the name of advertisers who requested their boards,
-- and advertisers the owner of boards they requested. Nothing else.
DROP POLICY IF EXISTS "owners_view_requesting_advertisers" ON public.profiles;
CREATE POLICY "owners_view_requesting_advertisers"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.booking_requests r
        WHERE r.advertiser_id = profiles.id
          AND r.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.booking_requests r
        WHERE r.owner_id = profiles.id
          AND r.advertiser_id = auth.uid()
    )
);


-- ---------------------------------------------------------------------
-- 4. HARD GUARANTEE: no two accepted bookings may overlap
-- ---------------------------------------------------------------------
-- The triggers above give friendly errors; this constraint is the
-- race-proof backstop (two owners/tabs accepting at the same instant).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.booking_requests
    DROP CONSTRAINT IF EXISTS no_overlapping_accepted_bookings;

ALTER TABLE public.booking_requests
    ADD CONSTRAINT no_overlapping_accepted_bookings
    EXCLUDE USING gist (
        billboard_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
    WHERE (status = 'accepted');

-- Friendly pre-check when an owner accepts (before the constraint fires)
CREATE OR REPLACE FUNCTION public.check_accept_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
        IF EXISTS (
            SELECT 1
            FROM public.booking_requests r
            WHERE r.billboard_id = NEW.billboard_id
              AND r.id <> NEW.id
              AND r.status = 'accepted'
              AND daterange(r.start_date, r.end_date, '[]')
                  && daterange(NEW.start_date, NEW.end_date, '[]')
        ) THEN
            RAISE EXCEPTION 'These dates overlap a booking you already accepted.'
                USING ERRCODE = '23P01';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_accept_overlap ON public.booking_requests;
CREATE TRIGGER trg_booking_accept_overlap
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.check_accept_overlap();

-- Booked ranges for the UI (calendar greying / "already booked" hint).
-- Returns dates only: no names, messages or ids of people.
CREATE OR REPLACE FUNCTION public.get_booked_ranges(p_billboard_id uuid)
RETURNS TABLE (start_date date, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.start_date, r.end_date
    FROM public.booking_requests r
    JOIN public.billboards b ON b.id = r.billboard_id
    WHERE r.billboard_id = p_billboard_id
      AND r.status = 'accepted'
      AND b.status = 'published'
    ORDER BY r.start_date;
$$;

REVOKE ALL ON FUNCTION public.get_booked_ranges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges(uuid) TO anon, authenticated;

-- Trigger order note: PostgreSQL fires same-event triggers alphabetically.
--   trg_booking_accept_overlap runs before trg_booking_update,
--   which is fine: both only validate, neither depends on the other.


-- ---------------------------------------------------------------------
-- 5. PROFILES: lock the role after sign-up
-- ---------------------------------------------------------------------
-- The app lets an advertiser upgrade to owner (owner-queries.ts), so
-- advertiser -> owner stays allowed. Everything else is blocked:
--   * owner -> advertiser while they still have billboards
--   * non-owner edits of someone else's row are already blocked by RLS

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;                       -- trusted caller
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF OLD.role = 'owner' AND NEW.role = 'advertiser'
           AND EXISTS (SELECT 1 FROM public.billboards WHERE owner_id = OLD.id) THEN
            RAISE EXCEPTION 'Remove your billboards before switching to an advertiser account.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_role ON public.profiles;
CREATE TRIGGER trg_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();


-- ---------------------------------------------------------------------
-- 6. SMALL EXTRAS
-- ---------------------------------------------------------------------
-- Restrict reads of the owners' billboards of unpublished status stays
-- as-is. Add an index that supports the overlap checks:
CREATE INDEX IF NOT EXISTS idx_booking_requests_billboard_status_dates
ON public.booking_requests (billboard_id, status, start_date, end_date);


-- ---------------------------------------------------------------------
-- QUICK TESTS (run as an authenticated user via the app or a test JWT)
-- ---------------------------------------------------------------------
-- a) As advertiser: UPDATE booking_requests SET status='accepted' ...
--      -> ERROR "Advertisers can only cancel their own requests."
-- b) As advertiser: INSERT with someone else's owner_id
--      -> owner_id is overwritten with the real owner (spoof ignored)
-- c) As anon:  SELECT phone FROM profiles          -> 0 rows
--    As anon:  SELECT * FROM public_owner_profiles -> id, name, avatar only
-- d) Owner accepts request A (1-10 Jan), then request B (5-15 Jan)
--      -> ERROR "These dates overlap a booking you already accepted."
-- e) Two tabs accept overlapping requests simultaneously
--      -> second one fails on no_overlapping_accepted_bookings
-- f) As advertiser: INSERT for your own listing -> ERROR
-- g) SELECT * FROM get_booked_ranges('<billboard uuid>') -> dates only
