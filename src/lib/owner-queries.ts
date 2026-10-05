import { supabase } from "@/integrations/supabase/client";
import { pathFromUrl, toBillboard } from "@/lib/queries";
import type { BillboardType, Lighting, ListingStatus, PricePeriod } from "@/lib/domain";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years — works for private or public buckets

export type BillboardDraftImage = {
  id?: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
};

export type BillboardInput = {
  title: string;
  description: string | null;
  billboard_type: BillboardType;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  lighting: Lighting;
  price: number;
  currency: string;
  price_period: PricePeriod;
  available_from: string | null;
  available_to: string | null;
  status: ListingStatus;
};

function toDb(input: BillboardInput) {
  return {
    title: input.title,
    description: input.description || null,
    type: input.billboard_type,
    location: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    city: input.city,
    country: input.country,
    width: input.width,
    height: input.height,
    price: input.price,
    currency: input.currency,
    pricing_period: input.price_period,
    lighting: input.lighting,
    status: input.status,
    available_from: input.available_from || null,
    available_to: input.available_to || null,
    updated_at: new Date().toISOString(),
  };
}

/** Owner-scoped listing fetch (RLS restricts rows to the signed-in owner). */
export async function fetchOwnerBillboard(id: string) {
  const { data, error } = await supabase.from("billboards").select("*, billboard_images(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toBillboard(data) : null;
}

export async function fetchOwnerStats(userId: string) {
  const [billboards, requests] = await Promise.all([
    supabase.from("billboards").select("id,status").eq("owner_id", userId),
    supabase.from("booking_requests").select("id,status").eq("owner_id", userId),
  ]);
  if (billboards.error) throw billboards.error;
  if (requests.error) throw requests.error;

  const rows = billboards.data ?? [];
  const reqs = requests.data ?? [];
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status !== "published").length,
    pendingRequests: reqs.filter((r) => r.status === "pending").length,
    acceptedBookings: reqs.filter((r) => r.status === "accepted").length,
  };
}

/** Uploads a file into the owner's own folder and returns a long-lived signed URL. */
export async function uploadBillboardImage(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("billboard-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("billboard-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError) throw signError;
  return { storage_path: path, url: data.signedUrl } satisfies Omit<BillboardDraftImage, "alt_text"> & {
    storage_path: string;
  };
}

export async function removeStoredImage(storagePath: string | null) {
  if (!storagePath) return;
  await supabase.storage.from("billboard-images").remove([storagePath]);
}

async function syncImages(billboardId: string, images: BillboardDraftImage[]) {
  const { data: existing, error } = await supabase
    .from("billboard_images")
    .select("id,image_url")
    .eq("billboard_id", billboardId);
  if (error) throw error;

  const keptIds = new Set(images.map((i) => i.id).filter(Boolean) as string[]);
  const removed = (existing ?? []).filter((row) => !keptIds.has(row.id));
  if (removed.length) {
    const { error: delError } = await supabase
      .from("billboard_images")
      .delete()
      .in("id", removed.map((r) => r.id));
    if (delError) throw delError;
    const paths = removed.map((r) => pathFromUrl(r.image_url)).filter((p): p is string => Boolean(p));
    if (paths.length) await supabase.storage.from("billboard-images").remove(paths);
  }

  for (const [index, image] of images.entries()) {
    if (image.id) {
      const { error: upError } = await supabase
        .from("billboard_images")
        .update({ display_order: index })
        .eq("id", image.id);
      if (upError) throw upError;
    } else {
      const { error: insError } = await supabase
        .from("billboard_images")
        .insert({ billboard_id: billboardId, image_url: image.url, display_order: index });
      if (insError) throw insError;
    }
  }
}

export async function createBillboard(
  userId: string,
  input: BillboardInput,
  images: BillboardDraftImage[],
) {
  const { data, error } = await supabase
    .from("billboards")
    .insert({ ...toDb(input), owner_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  await syncImages(data.id, images);
  return data.id;
}

export async function updateBillboard(
  billboardId: string,
  input: BillboardInput,
  images: BillboardDraftImage[],
) {
  const { error } = await supabase.from("billboards").update(toDb(input)).eq("id", billboardId);
  if (error) throw error;
  await syncImages(billboardId, images);
  return billboardId;
}

export async function setBillboardStatus(billboardId: string, status: ListingStatus) {
  const { error } = await supabase.from("billboards").update({ status, updated_at: new Date().toISOString() }).eq("id", billboardId);
  if (error) throw error;
}

export async function deleteBillboard(billboardId: string) {
  const { data: images } = await supabase
    .from("billboard_images")
    .select("image_url")
    .eq("billboard_id", billboardId);
  const paths = (images ?? []).map((i) => pathFromUrl(i.image_url)).filter((p): p is string => Boolean(p));

  await supabase.from("billboard_images").delete().eq("billboard_id", billboardId);
  const { error } = await supabase.from("billboards").delete().eq("id", billboardId);
  if (error) throw error;
  if (paths.length) await supabase.storage.from("billboard-images").remove(paths);
}

/** Switches the signed-in user's profile to the owner role (RLS lets users update their own profile). */
export async function ensureOwnerRole(userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (data?.role === "owner") return;
  const { error } = await supabase.from("profiles").upsert({ id: userId, role: "owner" });
  if (error) throw error;
}
