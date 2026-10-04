import { supabase } from "@/integrations/supabase/client";
import type { BillboardWithImages } from "@/lib/queries";
import type {
  AvailabilityStatus,
  BillboardType,
  DimensionUnit,
  ListingStatus,
  PricePeriod,
} from "@/lib/domain";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years — bucket is private

export type BillboardDraftImage = {
  id?: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
};

export type AvailabilityDraft = {
  id?: string;
  start_date: string;
  end_date: string;
  is_available: boolean;
  note: string | null;
};

export type BillboardInput = {
  title: string;
  description: string | null;
  billboard_type: BillboardType;
  address: string;
  area: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  dimension_unit: DimensionUnit;
  is_illuminated: boolean;
  price: number;
  currency: string;
  price_period: PricePeriod;
  availability: AvailabilityStatus;
  status: ListingStatus;
};

/** Owner-scoped listing fetch (RLS restricts rows to the signed-in owner). */
export async function fetchOwnerBillboard(id: string) {
  const { data, error } = await supabase
    .from("billboards")
    .select("*, billboard_images(id,url,storage_path,alt_text,sort_order,is_cover)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as (BillboardWithImages & { billboard_images: (BillboardDraftImage & { sort_order: number; is_cover: boolean; id: string })[] }) | null;
}

export async function fetchOwnerAvailability(billboardId: string) {
  const { data, error } = await supabase
    .from("billboard_availability")
    .select("*")
    .eq("billboard_id", billboardId)
    .order("start_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOwnerStats(userId: string) {
  const [billboards, requests, bookings] = await Promise.all([
    supabase.from("billboards").select("id,status").eq("owner_id", userId),
    supabase.from("booking_requests").select("id,status").eq("owner_id", userId),
    supabase.from("bookings").select("id,status").eq("owner_id", userId),
  ]);
  if (billboards.error) throw billboards.error;
  if (requests.error) throw requests.error;
  if (bookings.error) throw bookings.error;

  const rows = billboards.data ?? [];
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status !== "published").length,
    pendingRequests: (requests.data ?? []).filter((r) => r.status === "pending").length,
    acceptedBookings: (bookings.data ?? []).length,
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
    .select("id,storage_path")
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
    const paths = removed.map((r) => r.storage_path).filter((p): p is string => Boolean(p));
    if (paths.length) await supabase.storage.from("billboard-images").remove(paths);
  }

  for (const [index, image] of images.entries()) {
    const payload = {
      billboard_id: billboardId,
      url: image.url,
      storage_path: image.storage_path,
      alt_text: image.alt_text,
      sort_order: index,
      is_cover: index === 0,
    };
    if (image.id) {
      const { error: upError } = await supabase.from("billboard_images").update(payload).eq("id", image.id);
      if (upError) throw upError;
    } else {
      const { error: insError } = await supabase.from("billboard_images").insert(payload);
      if (insError) throw insError;
    }
  }
}

async function syncAvailability(billboardId: string, slots: AvailabilityDraft[]) {
  const { error: delError } = await supabase
    .from("billboard_availability")
    .delete()
    .eq("billboard_id", billboardId);
  if (delError) throw delError;
  if (!slots.length) return;
  const { error } = await supabase.from("billboard_availability").insert(
    slots.map((s) => ({
      billboard_id: billboardId,
      start_date: s.start_date,
      end_date: s.end_date,
      is_available: s.is_available,
      note: s.note,
    })),
  );
  if (error) throw error;
}

export async function createBillboard(
  userId: string,
  input: BillboardInput,
  images: BillboardDraftImage[],
  availability: AvailabilityDraft[],
) {
  const { data, error } = await supabase
    .from("billboards")
    .insert({ ...input, owner_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  await syncImages(data.id, images);
  await syncAvailability(data.id, availability);
  return data.id;
}

export async function updateBillboard(
  billboardId: string,
  input: BillboardInput,
  images: BillboardDraftImage[],
  availability: AvailabilityDraft[],
) {
  const { error } = await supabase.from("billboards").update(input).eq("id", billboardId);
  if (error) throw error;
  await syncImages(billboardId, images);
  await syncAvailability(billboardId, availability);
  return billboardId;
}

export async function setBillboardStatus(billboardId: string, status: ListingStatus) {
  const { error } = await supabase.from("billboards").update({ status }).eq("id", billboardId);
  if (error) throw error;
}

export async function deleteBillboard(billboardId: string) {
  const { data: images } = await supabase
    .from("billboard_images")
    .select("storage_path")
    .eq("billboard_id", billboardId);
  const paths = (images ?? []).map((i) => i.storage_path).filter((p): p is string => Boolean(p));

  await supabase.from("billboard_availability").delete().eq("billboard_id", billboardId);
  await supabase.from("billboard_images").delete().eq("billboard_id", billboardId);
  const { error } = await supabase.from("billboards").delete().eq("id", billboardId);
  if (error) throw error;
  if (paths.length) await supabase.storage.from("billboard-images").remove(paths);
}

/** Ensures the signed-in user carries the owner role before listing a space. */
export async function ensureOwnerRole(userId: string) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "owner" });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    // Unique violation just means the role already exists.
    if (!error.message.includes("23505")) return;
  }
}
