-- ============================================
-- BILLBOARD - SECURITY & RLS
-- ============================================

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billboard_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;


-- ============================================
-- PROFILES
-- ============================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());


DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());


DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- Publicly view owner profiles
DROP POLICY IF EXISTS "public_view_owner_profiles" ON public.profiles;
CREATE POLICY "public_view_owner_profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (role = 'owner');


-- ============================================
-- BILLBOARDS
-- ============================================

DROP POLICY IF EXISTS "public_view_published_billboards" ON public.billboards;
CREATE POLICY "public_view_published_billboards"
ON public.billboards
FOR SELECT
TO anon, authenticated
USING (
    status = 'published'
    OR owner_id = auth.uid()
);


DROP POLICY IF EXISTS "insert_billboards" ON public.billboards;
CREATE POLICY "insert_billboards"
ON public.billboards
FOR INSERT
TO authenticated
WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'owner'
    )
);


DROP POLICY IF EXISTS "owners_update_billboards" ON public.billboards;
CREATE POLICY "owners_update_billboards"
ON public.billboards
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());


DROP POLICY IF EXISTS "owners_delete_billboards" ON public.billboards;
CREATE POLICY "owners_delete_billboards"
ON public.billboards
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- ============================================
-- BILLBOARD IMAGES
-- ============================================

DROP POLICY IF EXISTS "public_view_billboard_images" ON public.billboard_images;
CREATE POLICY "public_view_billboard_images"
ON public.billboard_images
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.billboards b
        WHERE b.id = billboard_id
        AND (
            b.status = 'published'
            OR b.owner_id = auth.uid()
        )
    )
);


DROP POLICY IF EXISTS "owners_insert_billboard_images" ON public.billboard_images;
CREATE POLICY "owners_insert_billboard_images"
ON public.billboard_images
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.billboards b
        WHERE b.id = billboard_id
        AND b.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "owners_update_billboard_images" ON public.billboard_images;
CREATE POLICY "owners_update_billboard_images"
ON public.billboard_images
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.billboards b
        WHERE b.id = billboard_id
        AND b.owner_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "owners_delete_billboard_images" ON public.billboard_images;
CREATE POLICY "owners_delete_billboard_images"
ON public.billboard_images
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.billboards b
        WHERE b.id = billboard_id
        AND b.owner_id = auth.uid()
    )
);


-- ============================================
-- BOOKING REQUESTS
-- ============================================

DROP POLICY IF EXISTS "advertisers_select_own_requests" ON public.booking_requests;
CREATE POLICY "advertisers_select_own_requests"
ON public.booking_requests
FOR SELECT
TO authenticated
USING (
    advertiser_id = auth.uid()
);


DROP POLICY IF EXISTS "owners_select_requests_for_their_billboards" ON public.booking_requests;
CREATE POLICY "owners_select_requests_for_their_billboards"
ON public.booking_requests
FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid()
);


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
        WHERE b.id = billboard_id
        AND b.status = 'published'
        AND b.owner_id = owner_id
        AND (
            b.available_from IS NULL
            OR start_date >= b.available_from
        )
        AND (
            b.available_to IS NULL
            OR end_date <= b.available_to
        )
    )
);


DROP POLICY IF EXISTS "participants_update_requests" ON public.booking_requests;
CREATE POLICY "participants_update_requests"
ON public.booking_requests
FOR UPDATE
TO authenticated
USING (
    advertiser_id = auth.uid()
    OR owner_id = auth.uid()
)
WITH CHECK (
    advertiser_id = auth.uid()
    OR owner_id = auth.uid()
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_billboards_owner_id
ON public.billboards(owner_id);

CREATE INDEX IF NOT EXISTS idx_billboards_status
ON public.billboards(status);

CREATE INDEX IF NOT EXISTS idx_billboards_city
ON public.billboards(city);

CREATE INDEX IF NOT EXISTS idx_billboard_images_billboard_id
ON public.billboard_images(billboard_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_billboard_id
ON public.booking_requests(billboard_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_advertiser_id
ON public.booking_requests(advertiser_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_owner_id
ON public.booking_requests(owner_id);


-- ============================================
-- DONE
-- ============================================
-- ============================================
-- REVIEW SECURITY
-- ============================================

DROP POLICY IF EXISTS "reviews_select_involved" ON public.reviews;

CREATE POLICY "reviews_select_involved"
ON public.reviews
FOR SELECT
TO authenticated
USING (
    reviewer_id = auth.uid()
    OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;

CREATE POLICY "reviews_insert_own"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
    reviewer_id = auth.uid()
);

DROP POLICY IF EXISTS "reviews_update_owner" ON public.reviews;

CREATE POLICY "reviews_update_owner"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid()
)
WITH CHECK (
    owner_id = auth.uid()
);

REVOKE ALL ON public.reviews FROM anon;


-- ============================================
-- REVIEW INSERT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.enforce_review_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
    b public.booking_requests%ROWTYPE;
    bb_owner uuid;
BEGIN
    SELECT * INTO b
    FROM public.booking_requests
    WHERE id = NEW.booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF uid IS NOT NULL THEN
        IF b.advertiser_id <> uid THEN
            RAISE EXCEPTION 'You can only review your own bookings.';
        END IF;

        IF b.status <> 'accepted' THEN
            RAISE EXCEPTION 'Only accepted bookings can be reviewed.';
        END IF;

        IF b.end_date >= current_date THEN
            RAISE EXCEPTION 'You can review this billboard once the booking period has ended.';
        END IF;
    END IF;

    SELECT owner_id
    INTO bb_owner
    FROM public.billboards
    WHERE id = b.billboard_id;

    IF bb_owner IS NULL THEN
        RAISE EXCEPTION 'This billboard does not have an owner.';
    END IF;

    NEW.billboard_id := b.billboard_id;
    NEW.owner_id := bb_owner;
    NEW.reviewer_id := b.advertiser_id;
    NEW.comment := NULLIF(BTRIM(COALESCE(NEW.comment, '')), '');

    IF uid IS NOT NULL THEN
        NEW.owner_reply := NULL;
        NEW.owner_replied_at := NULL;
        NEW.created_at := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_insert ON public.reviews;

CREATE TRIGGER trg_review_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_review_insert();


-- ============================================
-- REVIEW UPDATE / OWNER REPLY TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.enforce_review_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
    OR NEW.billboard_id IS DISTINCT FROM OLD.billboard_id
    OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id
    OR NEW.rating IS DISTINCT FROM OLD.rating
    OR NEW.location_matched IS DISTINCT FROM OLD.location_matched
    OR NEW.photos_accurate IS DISTINCT FROM OLD.photos_accurate
    OR NEW.owner_responsive IS DISTINCT FROM OLD.owner_responsive
    OR NEW.comment IS DISTINCT FROM OLD.comment
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
        RAISE EXCEPTION 'A submitted review cannot be edited.';
    END IF;

    IF uid = OLD.owner_id THEN
        IF OLD.owner_reply IS NOT NULL THEN
            RAISE EXCEPTION 'You have already replied to this review.';
        END IF;

        NEW.owner_reply :=
            NULLIF(BTRIM(COALESCE(NEW.owner_reply, '')), '');

        IF NEW.owner_reply IS NULL THEN
            RAISE EXCEPTION 'Please write a reply.';
        END IF;

        NEW.owner_replied_at := now();

        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed.';
END;
$$;

DROP TRIGGER IF EXISTS trg_review_update ON public.reviews;

CREATE TRIGGER trg_review_update
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_review_update();

