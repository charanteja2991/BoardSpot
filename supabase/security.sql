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