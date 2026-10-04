-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'advertiser');
CREATE TYPE public.billboard_type AS ENUM ('highway','digital','roadside','in_mall','transit','wall_wrap','gantry','rooftop');
CREATE TYPE public.price_period AS ENUM ('daily','weekly','monthly','yearly');
CREATE TYPE public.listing_status AS ENUM ('draft','pending','published','rejected','suspended');
CREATE TYPE public.availability_status AS ENUM ('available','booked','unavailable');
CREATE TYPE public.booking_status AS ENUM ('pending','accepted','rejected','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded','failed');
CREATE TYPE public.dimension_unit AS ENUM ('ft','m');

-- SHARED TRIGGER FN
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES (public-safe fields)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Member',
  company_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PRIVATE CONTACT DETAILS
CREATE TABLE public.profile_contacts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- BILLBOARDS
CREATE TABLE public.billboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  billboard_type public.billboard_type NOT NULL DEFAULT 'roadside',
  is_illuminated BOOLEAN NOT NULL DEFAULT false,
  width NUMERIC(10,2) NOT NULL,
  height NUMERIC(10,2) NOT NULL,
  dimension_unit public.dimension_unit NOT NULL DEFAULT 'ft',
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  price_period public.price_period NOT NULL DEFAULT 'monthly',
  availability public.availability_status NOT NULL DEFAULT 'available',
  status public.listing_status NOT NULL DEFAULT 'draft',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX billboards_city_idx ON public.billboards (lower(city));
CREATE INDEX billboards_status_idx ON public.billboards (status, is_visible);
CREATE INDEX billboards_owner_idx ON public.billboards (owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboards TO authenticated;
GRANT SELECT ON public.billboards TO anon;
GRANT ALL ON public.billboards TO service_role;
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER billboards_updated BEFORE UPDATE ON public.billboards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.billboard_is_public(_billboard_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.billboards b WHERE b.id = _billboard_id AND b.status = 'published' AND b.is_visible);
$$;

CREATE OR REPLACE FUNCTION public.owns_billboard(_billboard_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.billboards b WHERE b.id = _billboard_id AND b.owner_id = auth.uid());
$$;

-- BILLBOARD IMAGES
CREATE TABLE public.billboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX billboard_images_billboard_idx ON public.billboard_images (billboard_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboard_images TO authenticated;
GRANT SELECT ON public.billboard_images TO anon;
GRANT ALL ON public.billboard_images TO service_role;
ALTER TABLE public.billboard_images ENABLE ROW LEVEL SECURITY;

-- AVAILABILITY
CREATE TABLE public.billboard_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX billboard_availability_idx ON public.billboard_availability (billboard_id, start_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboard_availability TO authenticated;
GRANT SELECT ON public.billboard_availability TO anon;
GRANT ALL ON public.billboard_availability TO service_role;
ALTER TABLE public.billboard_availability ENABLE ROW LEVEL SECURITY;

-- BOOKING REQUESTS
CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT,
  company_name TEXT,
  contact_phone TEXT,
  estimated_total NUMERIC(12,2),
  status public.booking_status NOT NULL DEFAULT 'pending',
  owner_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX booking_requests_advertiser_idx ON public.booking_requests (advertiser_id);
CREATE INDEX booking_requests_owner_idx ON public.booking_requests (owner_id);
GRANT SELECT, INSERT, UPDATE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER booking_requests_updated BEFORE UPDATE ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYMENTS (future-ready)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  provider TEXT,
  provider_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- SAVED BILLBOARDS
CREATE TABLE public.saved_billboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, billboard_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_billboards TO authenticated;
GRANT ALL ON public.saved_billboards TO service_role;
ALTER TABLE public.saved_billboards ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- profiles
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

-- profile_contacts
CREATE POLICY contacts_self_read ON public.profile_contacts FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY contacts_self_insert ON public.profile_contacts FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY contacts_self_update ON public.profile_contacts FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles
CREATE POLICY roles_self_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY roles_self_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role <> 'admin');

-- billboards
CREATE POLICY billboards_public_read ON public.billboards FOR SELECT TO anon, authenticated USING (status = 'published' AND is_visible);
CREATE POLICY billboards_owner_read ON public.billboards FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY billboards_owner_insert ON public.billboards FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY billboards_owner_update ON public.billboards FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY billboards_owner_delete ON public.billboards FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

-- images
CREATE POLICY images_public_read ON public.billboard_images FOR SELECT TO anon, authenticated USING (public.billboard_is_public(billboard_id));
CREATE POLICY images_owner_read ON public.billboard_images FOR SELECT TO authenticated USING (public.owns_billboard(billboard_id) OR public.is_admin());
CREATE POLICY images_owner_write ON public.billboard_images FOR INSERT TO authenticated WITH CHECK (public.owns_billboard(billboard_id));
CREATE POLICY images_owner_update ON public.billboard_images FOR UPDATE TO authenticated USING (public.owns_billboard(billboard_id)) WITH CHECK (public.owns_billboard(billboard_id));
CREATE POLICY images_owner_delete ON public.billboard_images FOR DELETE TO authenticated USING (public.owns_billboard(billboard_id) OR public.is_admin());

-- availability
CREATE POLICY avail_public_read ON public.billboard_availability FOR SELECT TO anon, authenticated USING (public.billboard_is_public(billboard_id));
CREATE POLICY avail_owner_read ON public.billboard_availability FOR SELECT TO authenticated USING (public.owns_billboard(billboard_id) OR public.is_admin());
CREATE POLICY avail_owner_write ON public.billboard_availability FOR INSERT TO authenticated WITH CHECK (public.owns_billboard(billboard_id));
CREATE POLICY avail_owner_update ON public.billboard_availability FOR UPDATE TO authenticated USING (public.owns_billboard(billboard_id)) WITH CHECK (public.owns_billboard(billboard_id));
CREATE POLICY avail_owner_delete ON public.billboard_availability FOR DELETE TO authenticated USING (public.owns_billboard(billboard_id) OR public.is_admin());

-- booking requests
CREATE POLICY br_read ON public.booking_requests FOR SELECT TO authenticated USING (advertiser_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY br_insert ON public.booking_requests FOR INSERT TO authenticated WITH CHECK (advertiser_id = auth.uid() AND public.billboard_is_public(billboard_id));
CREATE POLICY br_update ON public.booking_requests FOR UPDATE TO authenticated USING (advertiser_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin()) WITH CHECK (advertiser_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin());

-- bookings
CREATE POLICY bk_read ON public.bookings FOR SELECT TO authenticated USING (advertiser_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY bk_insert ON public.bookings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY bk_update ON public.bookings FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- payments
CREATE POLICY pay_read ON public.payments FOR SELECT TO authenticated USING (payer_id = auth.uid() OR payee_id = auth.uid() OR public.is_admin());

-- saved
CREATE POLICY saved_read ON public.saved_billboards FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY saved_insert ON public.saved_billboards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY saved_delete ON public.saved_billboards FOR DELETE TO authenticated USING (user_id = auth.uid());

-- NEW USER BOOTSTRAP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Member'),
    NEW.raw_user_meta_data->>'company_name'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_contacts (id, contact_email)
  VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'advertiser')::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();