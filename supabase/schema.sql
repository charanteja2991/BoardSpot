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