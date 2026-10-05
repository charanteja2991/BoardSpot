-- =========================================================
-- BILLBOARD PROJECT
-- DATABASE SCHEMA
-- =========================================================
-- This file defines the core PostgreSQL tables and
-- relationships used by the BILLBOARD application.
--
-- NOTE:
-- This file is for version control/documentation.
-- The live Supabase database has already been created.
-- =========================================================


-- =========================================================
-- 1. BILLBOARDS
-- =========================================================

CREATE TABLE public.billboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User who owns this billboard
    owner_id uuid
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Basic billboard information
    title text NOT NULL,
    description text,

    -- Billboard type
    type text
        CHECK (
            type IN (
                'static',
                'digital',
                'mobile',
                'poster'
            )
        ),

    -- Location information
    location text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    city text,
    country text,

    -- Physical dimensions
    width numeric(10,2),
    height numeric(10,2),

    -- Pricing
    price numeric(10,2) NOT NULL,
    currency text NOT NULL DEFAULT 'INR',

    pricing_period text
        CHECK (
            pricing_period IN (
                'day',
                'week',
                'month'
            )
        ),

    -- Lighting
    lighting text
        CHECK (
            lighting IN (
                'none',
                'frontlit',
                'backlit'
            )
        ),

    -- Publication status
    status text NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'published',
                'unpublished'
            )
        ),

    -- Availability
    available_from date,
    available_to date,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);


-- =========================================================
-- 2. USER PROFILES
-- =========================================================
-- Stores application-specific information about users.
-- Authentication itself is handled by Supabase Auth.
-- =========================================================

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name text,

    -- Application role
    role text NOT NULL DEFAULT 'advertiser'
        CHECK (
            role IN (
                'advertiser',
                'owner'
            )
        ),

    avatar_url text,
    phone text,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);


-- =========================================================
-- 3. BILLBOARD IMAGES
-- =========================================================
-- Stores references to images uploaded to Supabase Storage.
-- =========================================================

CREATE TABLE public.billboard_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    billboard_id uuid NOT NULL
        REFERENCES public.billboards(id)
        ON DELETE CASCADE,

    image_url text NOT NULL,

    display_order integer DEFAULT 0,

    created_at timestamptz DEFAULT now()
);


-- =========================================================
-- 4. BOOKING REQUESTS
-- =========================================================
-- Advertisers use this table to request billboard bookings.
-- =========================================================

CREATE TABLE public.booking_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Billboard being requested
    billboard_id uuid NOT NULL
        REFERENCES public.billboards(id)
        ON DELETE CASCADE,

    -- Person requesting the billboard
    advertiser_id uuid NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Owner receiving the request
    owner_id uuid
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Requested booking period
    start_date date NOT NULL,
    end_date date NOT NULL,

    -- Optional message from advertiser
    message text,

    -- Booking status
    status text NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'accepted',
                'rejected',
                'cancelled'
            )
        ),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- End date cannot be before start date
    CHECK (
        end_date >= start_date
    )
);


-- =========================================================
-- 5. INDEXES
-- =========================================================
-- Indexes improve lookup speed for commonly queried columns.
-- =========================================================


-- Billboard image lookup
CREATE INDEX IF NOT EXISTS
    billboard_images_billboard_id_idx
ON public.billboard_images(billboard_id);


-- Booking lookup by billboard
CREATE INDEX IF NOT EXISTS
    booking_requests_billboard_id_idx
ON public.booking_requests(billboard_id);


-- Booking lookup by advertiser
CREATE INDEX IF NOT EXISTS
    booking_requests_advertiser_id_idx
ON public.booking_requests(advertiser_id);


-- Booking lookup by owner
CREATE INDEX IF NOT EXISTS
    booking_requests_owner_id_idx
ON public.booking_requests(owner_id);


-- Billboard lookup by owner
CREATE INDEX IF NOT EXISTS
    billboards_owner_id_idx
ON public.billboards(owner_id);


-- Billboard lookup by city
CREATE INDEX IF NOT EXISTS
    billboards_city_idx
ON public.billboards(city);


-- Billboard lookup by status
CREATE INDEX IF NOT EXISTS
    billboards_status_idx
ON public.billboards(status);


-- =========================================================
-- DATABASE RELATIONSHIPS
-- =========================================================
--
-- auth.users
--    │
--    ├── profiles
--    │
--    └── billboards.owner_id
--
-- billboards
--    │
--    ├── billboard_images
--    │
--    └── booking_requests
--
-- auth.users
--    │
--    ├── booking_requests.advertiser_id
--    └── booking_requests.owner_id
--
-- =========================================================
-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL UNIQUE
        REFERENCES public.booking_requests(id) ON DELETE CASCADE,
    billboard_id uuid NOT NULL
        REFERENCES public.billboards(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    location_matched boolean,
    photos_accurate boolean,
    owner_responsive boolean,
    comment text CHECK (comment IS NULL OR char_length(comment) <= 500),
    owner_reply text CHECK (owner_reply IS NULL OR char_length(owner_reply) <= 500),
    owner_replied_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (reviewer_id, billboard_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_billboard_created
ON public.reviews (billboard_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_owner_created
ON public.reviews (owner_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- ============================================
-- PUBLIC REVIEWS VIEW
-- ============================================

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
        WHEN BTRIM(COALESCE(p.full_name, '')) = ''
            THEN 'Advertiser'
        ELSE
            SPLIT_PART(BTRIM(p.full_name), ' ', 1)
            ||
            CASE
                WHEN POSITION(' ' IN BTRIM(p.full_name)) > 0
                THEN ' ' ||
                    UPPER(
                        LEFT(
                            REGEXP_REPLACE(BTRIM(p.full_name), '^.*\s', ''),
                            1
                        )
                    ) || '.'
                ELSE ''
            END
    END AS reviewer_name
FROM public.reviews r
JOIN public.booking_requests b ON b.id = r.booking_id
JOIN public.billboards bb ON bb.id = r.billboard_id
LEFT JOIN public.profiles p ON p.id = r.reviewer_id;

REVOKE ALL ON public.public_reviews FROM PUBLIC;

GRANT SELECT ON public.public_reviews TO anon, authenticated;


-- ============================================
-- BILLBOARD REVIEW STATISTICS
-- ============================================

CREATE OR REPLACE VIEW public.billboard_review_stats AS
SELECT
    billboard_id,
    COUNT(*)::int AS review_count,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE location_matched)
        / NULLIF(COUNT(location_matched), 0)
    ) AS location_matched_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE photos_accurate)
        / NULLIF(COUNT(photos_accurate), 0)
    ) AS photos_accurate_pct,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE owner_responsive)
        / NULLIF(COUNT(owner_responsive), 0)
    ) AS owner_responsive_pct
FROM public.reviews
GROUP BY billboard_id;

REVOKE ALL ON public.billboard_review_stats FROM PUBLIC;

GRANT SELECT ON public.billboard_review_stats TO anon, authenticated;


-- ============================================
-- OWNER REVIEW STATISTICS
-- ============================================

CREATE OR REPLACE VIEW public.owner_review_stats AS
SELECT
    owner_id,
    COUNT(*)::int AS review_count,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating
FROM public.reviews
GROUP BY owner_id;

REVOKE ALL ON public.owner_review_stats FROM PUBLIC;

GRANT SELECT ON public.owner_review_stats TO anon, authenticated;


-- =========================================================
-- REVIEW MODERATION UPGRADE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.admins (
    user_id uuid PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS hidden_reason text;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS hidden_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'reviews_hidden_reason_length'
    ) THEN
        ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_hidden_reason_length
        CHECK (
            hidden_reason IS NULL
            OR char_length(hidden_reason) <= 500
        );
    END IF;
END
$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'reviews_hidden_reason_required'
    ) THEN
        ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_hidden_reason_required
        CHECK (
            NOT is_hidden
            OR btrim(coalesce(hidden_reason, '')) <> ''
        );
    END IF;
END
$;

