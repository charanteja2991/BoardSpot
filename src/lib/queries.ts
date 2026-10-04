import { supabase } from "@/integrations/supabase/client";
import type { AvailabilityStatus, BillboardRow, BillboardType } from "@/lib/domain";

export type BillboardWithImages = BillboardRow & {
  billboard_images: { id: string; url: string; alt_text: string | null; sort_order: number; is_cover: boolean }[];
};

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

const IMAGE_SELECT = "id,url,alt_text,sort_order,is_cover";

/** Public marketplace listing query — works without a session (RLS allows anon reads). */
export async function fetchPublicBillboards(filters: BrowseFilters = {}) {
  let query = supabase
    .from("billboards")
    .select(`*, billboard_images(${IMAGE_SELECT})`)
    .eq("status", "published")
    .eq("is_visible", true);

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`title.ilike.${term},address.ilike.${term},city.ilike.${term},area.ilike.${term}`);
  }
  if (filters.city?.trim()) query = query.ilike("city", `%${filters.city.trim()}%`);
  if (filters.types?.length) query = query.in("billboard_type", filters.types);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minWidth != null) query = query.gte("width", filters.minWidth);
  if (filters.minHeight != null) query = query.gte("height", filters.minHeight);
  if (filters.availability && filters.availability !== "any") {
    query = query.eq("availability", filters.availability);
  }
  if (filters.illuminatedOnly) query = query.eq("is_illuminated", true);

  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return (data ?? []) as BillboardWithImages[];
}

export async function fetchFeaturedBillboards(limit = 3) {
  const { data, error } = await supabase
    .from("billboards")
    .select(`*, billboard_images(${IMAGE_SELECT})`)
    .eq("status", "published")
    .eq("is_visible", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BillboardWithImages[];
}

export async function fetchPopularCities() {
  const { data, error } = await supabase
    .from("billboards")
    .select("city")
    .eq("status", "published")
    .eq("is_visible", true)
    .limit(500);
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
  const { data, error } = await supabase
    .from("billboards")
    .select(`*, billboard_images(${IMAGE_SELECT})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const billboard = data as BillboardWithImages;

  const [{ data: owner }, { data: availability }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,display_name,company_name,avatar_url,bio")
      .eq("id", billboard.owner_id)
      .maybeSingle(),
    supabase
      .from("billboard_availability")
      .select("*")
      .eq("billboard_id", id)
      .order("start_date", { ascending: true }),
  ]);

  return { billboard, owner: owner ?? null, availability: availability ?? [] };
}

export async function fetchMyBillboards(userId: string) {
  const { data, error } = await supabase
    .from("billboards")
    .select(`*, billboard_images(${IMAGE_SELECT})`)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BillboardWithImages[];
}

export async function fetchSavedBillboards(userId: string) {
  const { data, error } = await supabase
    .from("saved_billboards")
    .select(`id, created_at, billboards(*, billboard_images(${IMAGE_SELECT}))`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.billboards as unknown as BillboardWithImages | null)
    .filter((b): b is BillboardWithImages => Boolean(b));
}

export async function fetchSavedIds(userId: string) {
  const { data, error } = await supabase.from("saved_billboards").select("billboard_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.billboard_id));
}

export async function toggleSaved(userId: string, billboardId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("saved_billboards")
      .delete()
      .eq("user_id", userId)
      .eq("billboard_id", billboardId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from("saved_billboards")
    .insert({ user_id: userId, billboard_id: billboardId });
  if (error) throw error;
  return true;
}

export async function fetchMyRequests(userId: string) {
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*, billboards(id,title,city,area,currency,price,price_period)")
    .eq("advertiser_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOwnerRequests(userId: string) {
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*, billboards(id,title,city,area,currency)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyBookings(userId: string, as: "advertiser" | "owner") {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, billboards(id,title,city,area)")
    .eq(as === "advertiser" ? "advertiser_id" : "owner_id", userId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
