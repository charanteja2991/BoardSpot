import { supabase } from "@/integrations/supabase/client";

/** Show an average only when there are enough reviews for it to mean something. */
export const MIN_REVIEWS_FOR_AVERAGE = 3;
export const MAX_COMMENT = 500;

export type ReviewStats = {
  billboard_id: string;
  review_count: number;
  avg_rating: number;
  location_matched_pct: number | null;
  photos_accurate_pct: number | null;
  owner_responsive_pct: number | null;
};

export type OwnerReviewStats = { owner_id: string; review_count: number; avg_rating: number };

/** A review as the public sees it (from the `public_reviews` view). */
export type PublicReview = {
  id: string;
  billboard_id: string;
  billboard_title: string | null;
  owner_id: string;
  rating: number;
  location_matched: boolean | null;
  photos_accurate: boolean | null;
  owner_responsive: boolean | null;
  comment: string | null;
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
  campaign_ended: string | null;
  reviewer_name: string;
};

export type AdminReviewRow = {
  id: string;
  billboard_id: string;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  billboards: { title: string | null } | null;
};

export type ReviewInput = {
  booking_id: string;
  rating: number;
  location_matched: boolean | null;
  photos_accurate: boolean | null;
  owner_responsive: boolean | null;
  comment: string;
};

const toNum = (v: unknown) => (v == null ? null : Number(v));

function toStats(row: any): ReviewStats {
  return {
    billboard_id: row.billboard_id,
    review_count: Number(row.review_count ?? 0),
    avg_rating: Number(row.avg_rating ?? 0),
    location_matched_pct: toNum(row.location_matched_pct),
    photos_accurate_pct: toNum(row.photos_accurate_pct),
    owner_responsive_pct: toNum(row.owner_responsive_pct),
  };
}

/* ------------------------------ reading ------------------------------ */

export async function fetchBillboardReviews(billboardId: string) {
  const { data, error } = await supabase
    .from("public_reviews")
    .select("*")
    .eq("billboard_id", billboardId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicReview[];
}

export async function fetchBillboardReviewStats(billboardId: string) {
  const { data, error } = await supabase
    .from("billboard_review_stats")
    .select("*")
    .eq("billboard_id", billboardId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toStats(data) : null;
}

export async function fetchOwnerReviewStats(ownerId: string) {
  const { data, error } = await supabase
    .from("owner_review_stats")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data
    ? ({ owner_id: data.owner_id, review_count: Number(data.review_count), avg_rating: Number(data.avg_rating) } as OwnerReviewStats)
    : null;
}

/** Reviews left on the signed-in owner's billboards (hidden ones are excluded by the view). */
export async function fetchOwnerReviews(ownerId: string) {
  const { data, error } = await supabase
    .from("public_reviews")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicReview[];
}

/** Billboards the signed-in user has already reviewed (one review per billboard). */
export async function fetchMyReviewedBillboardIds(userId: string) {
  const { data, error } = await supabase.from("reviews").select("billboard_id").eq("reviewer_id", userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r: any) => r.billboard_id as string));
}

/**
 * Adds `review_stats` to a list of billboards with ONE query.
 * Never throws: if the reviews migration has not been run yet, the listing still loads.
 */
export async function attachReviewStats<T extends { id: string }>(rows: T[]): Promise<(T & { review_stats: ReviewStats | null })[]> {
  if (!rows.length) return [];
  try {
    const { data, error } = await supabase
      .from("billboard_review_stats")
      .select("*")
      .in("billboard_id", rows.map((r) => r.id));
    if (error) throw error;
    const byId = new Map((data ?? []).map((d: any) => [d.billboard_id as string, toStats(d)]));
    return rows.map((r) => ({ ...r, review_stats: byId.get(r.id) ?? null }));
  } catch {
    return rows.map((r) => ({ ...r, review_stats: null }));
  }
}

/* ------------------------------ writing ------------------------------ */

export async function createReview(input: ReviewInput) {
  // billboard / owner / reviewer are filled in by the database from the booking.
  const { error } = await supabase.from("reviews").insert({
    booking_id: input.booking_id,
    rating: input.rating,
    location_matched: input.location_matched,
    photos_accurate: input.photos_accurate,
    owner_responsive: input.owner_responsive,
    comment: input.comment.trim() || null,
  });
  if (error) throw new Error(error.message);
}

export async function replyToReview(id: string, reply: string) {
  const { error } = await supabase.from("reviews").update({ owner_reply: reply.trim() }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------- admin ------------------------------- */

export async function fetchReviewsForAdmin(hidden: boolean) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, billboard_id, rating, comment, owner_reply, is_hidden, hidden_reason, created_at, billboards(title)")
    .eq("is_hidden", hidden)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminReviewRow[];
}

export async function setReviewHidden(id: string, hidden: boolean, reason: string | null) {
  const { error } = await supabase
    .from("reviews")
    .update({ is_hidden: hidden, hidden_reason: hidden ? reason : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
