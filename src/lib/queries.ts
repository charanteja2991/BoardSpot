import { supabase } from "@/integrations/supabase/client";
import type { AvailabilityStatus, BillboardRow, BillboardType, BookingStatus, ProfileRow } from "@/lib/domain";
import { attachReviewStats, type ReviewStats } from "@/lib/reviews";

export type BillboardImage = {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  storage_path: string | null;
};

export type BillboardWithImages = BillboardRow & { billboard_images: BillboardImage[]; review_stats?: ReviewStats | null };

export type BrowseFilters = {
  q?: string;
  city?: string;
  types?: BillboardType[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minWidth?: number | null;
  minHeight?: number | null;
  availability?: AvailabilityStatus | "any";
  illuminatedOnly?: boolean;
  sort?: "recent" | "price_asc" | "price_desc";
};

const SELECT = "*, billboard_images(*)";

export function pathFromUrl(url: string): string | null {
  const m = url.match(/\/billboard-images\/(.+?)(\?|$)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function deriveAvailability(row: any): AvailabilityStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (row.status !== "published") return "unavailable";
  if (row.available_to && row.available_to < today) return "unavailable";
  return "available";
}

/** Maps a `billboards` row (+ joined images) from the database into the UI shape. */
export function toBillboard(row: any): BillboardWithImages {
  const images = ([...(row.billboard_images ?? [])] as any[])
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((img, index) => ({
      id: img.id,
      url: img.image_url,
      alt_text: null,
      sort_order: index,
      is_cover: index === 0,
      storage_path: pathFromUrl(img.image_url),
    }));
  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    description: row.description,
    billboard_type: row.type ?? "static",
    address: row.location ?? "",
    area: null,
    city: row.city ?? "",
    state: null,
    country: row.country ?? "India",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    width: Number(row.width ?? 0),
    height: Number(row.height ?? 0),
    dimension_unit: "ft",
    lighting: row.lighting ?? "none",
    is_illuminated: (row.lighting ?? "none") !== "none",
    price: Number(row.price),
    currency: row.currency ?? "INR",
    price_period: row.pricing_period ?? "month",
    availability: deriveAvailability(row),
    status: row.status,
    is_visible: true,
    available_from: row.available_from,
    available_to: row.available_to,
    created_at: row.created_at,
    billboard_images: images,
  };
}

export function toProfile(row: any): ProfileRow {
  return {
    id: row.id,
    display_name: row.full_name || "Member",
    company_name: row.business_name ?? null,
    bio: null,
    avatar_url: row.avatar_url ?? null,
    phone: row.phone ?? null,
    role: row.role ?? "advertiser",
  };
}

/** Public marketplace listing query — works without a session (RLS allows anon reads). */
export async function fetchPublicBillboards(filters: BrowseFilters = {}) {
  let query = supabase.from("billboards").select(SELECT).eq("status", "published");

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`title.ilike.${term},location.ilike.${term},city.ilike.${term}`);
  }
  if (filters.city?.trim()) query = query.ilike("city", `%${filters.city.trim()}%`);
  if (filters.types?.length) query = query.in("type", filters.types);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minWidth != null) query = query.gte("width", filters.minWidth);
  if (filters.minHeight != null) query = query.gte("height", filters.minHeight);
  if (filters.illuminatedOnly) query = query.neq("lighting", "none");

  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(100);
  if (error) throw error;
  let rows = await attachReviewStats((data ?? []).map(toBillboard));
  if (filters.availability && filters.availability !== "any") {
    rows = rows.filter((b) => b.availability === filters.availability);
  }
  return rows;
}

export async function fetchFeaturedBillboards(limit = 3) {
  const { data, error } = await supabase
    .from("billboards")
    .select(SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachReviewStats((data ?? []).map(toBillboard));
}

export async function fetchPopularCities() {
  const { data, error } = await supabase.from("billboards").select("city").eq("status", "published").limit(500);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const city = (row.city ?? "").trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([city, count]) => ({ city, count }));
}

export async function fetchBillboardDetail(id: string) {
  const { data, error } = await supabase.from("billboards").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const billboard = toBillboard(data);
  // Public, minimal owner info only (no phone/email): see public_owner_profiles in the migrations.
  const { data: owner } = await supabase
    .from("public_owner_profiles")
    .select("id, full_name, avatar_url, business_name")
    .eq("id", billboard.owner_id)
    .maybeSingle();
  return { billboard, owner: owner ? toProfile(owner) : null };
}

export async function fetchMyBillboards(userId: string) {
  const { data, error } = await supabase
    .from("billboards")
    .select(SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBillboard);
}

/* ------------------------------ saved list ------------------------------
 * The database has no saved-billboards table, so favourites are kept per user
 * in this browser's localStorage. */
const savedKey = (userId: string) => `panorama:saved:${userId}`;

function readSaved(userId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(savedKey(userId)) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export async function fetchSavedIds(userId: string) {
  return new Set(readSaved(userId));
}

export async function fetchSavedBillboards(userId: string) {
  const ids = readSaved(userId);
  if (!ids.length) return [];
  const { data, error } = await supabase.from("billboards").select(SELECT).in("id", ids).eq("status", "published");
  if (error) throw error;
  return (data ?? []).map(toBillboard);
}

export async function toggleSaved(userId: string, billboardId: string, saved: boolean) {
  const ids = new Set(readSaved(userId));
  if (saved) ids.delete(billboardId);
  else ids.add(billboardId);
  localStorage.setItem(savedKey(userId), JSON.stringify([...ids]));
  return !saved;
}

/* --------------------------- booking requests --------------------------- */
const REQUEST_SELECT = "*, billboards(id,title,city,location,currency,price,pricing_period)";

function mapRequest(row: any) {
  const b = row.billboards;
  return {
    ...row,
    billboards: b
      ? { id: b.id, title: b.title, city: b.city, area: b.location, currency: b.currency, price: b.price, price_period: b.pricing_period }
      : null,
  };
}

export async function fetchMyRequests(userId: string) {
  const { data, error } = await supabase
    .from("booking_requests")
    .select(REQUEST_SELECT)
    .eq("advertiser_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

export async function fetchOwnerRequests(userId: string) {
  const { data, error } = await supabase
    .from("booking_requests")
    .select(REQUEST_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRequest);
}

export async function createBookingRequest(input: {
  billboard_id: string;
  advertiser_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  message: string | null;
}) {
  const { error } = await supabase.from("booking_requests").insert({ ...input, status: "pending" });
  if (error) throw new Error(error.message);
}

export async function setRequestStatus(id: string, status: BookingStatus) {
  const { error } = await supabase
    .from("booking_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
