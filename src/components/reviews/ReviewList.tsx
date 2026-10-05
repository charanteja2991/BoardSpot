import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { StarDisplay } from "@/components/reviews/StarRating";
import {
  fetchBillboardReviewStats,
  fetchBillboardReviews,
  fetchOwnerReviewStats,
  fetchOwnerReviews,
  MAX_COMMENT,
  MIN_REVIEWS_FOR_AVERAGE,
  replyToReview,
  type PublicReview,
  type ReviewStats,
} from "@/lib/reviews";

/** Small green pill used for the "Verified booking" label. */
function Pill({ label, title }: { label: string; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
      <Check className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function Check3({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-brand/10 text-brand" : "bg-destructive/10 text-destructive"}`}
    >
      {value ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
      {label}
    </span>
  );
}

function ReplyBox({ reviewId }: { reviewId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const mutation = useMutation({
    mutationFn: () => replyToReview(reviewId, text),
    onSuccess: () => {
      toast.success("Reply posted");
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post your reply."),
  });
  return (
    <div className="mt-3 space-y-2">
      <label className="sr-only" htmlFor={`reply-${reviewId}`}>
        Reply to this review
      </label>
      <Textarea
        id={`reply-${reviewId}`}
        rows={2}
        maxLength={MAX_COMMENT}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply publicly. You can reply once and can't edit it afterwards."
      />
      <Button size="sm" disabled={!text.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? "Posting…" : "Post reply"}
      </Button>
    </div>
  );
}

export function ReviewCard({ review, showBillboard = false }: { review: PublicReview; showBillboard?: boolean }) {
  const { user } = useAuth();
  const canReply = user?.id === review.owner_id && !review.owner_reply;
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StarDisplay value={review.rating} />
        <span className="text-sm font-semibold">{review.reviewer_name}</span>
        <Pill label="Verified booking" title="Posted by an advertiser whose booking was accepted and has finished" />
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
      </div>

      {showBillboard && review.billboard_title ? (
        <p className="mt-1 text-sm">
          <Link to="/billboards/$id" params={{ id: review.billboard_id }} className="font-medium text-brand hover:text-brand-dark">
            {review.billboard_title}
          </Link>
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Check3 label="Location matched" value={review.location_matched} />
        <Check3 label="Photos accurate" value={review.photos_accurate} />
        <Check3 label="Owner responsive" value={review.owner_responsive} />
      </div>

      {review.comment ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{review.comment}</p> : null}

      {review.owner_reply ? (
        <div className="mt-3 rounded-lg bg-surface p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Owner reply{review.owner_replied_at ? ` · ${formatDate(review.owner_replied_at)}` : ""}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm">{review.owner_reply}</p>
        </div>
      ) : null}

      {canReply ? <ReplyBox reviewId={review.id} /> : null}
    </li>
  );
}

function Pct({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Summary({ stats }: { stats: ReviewStats }) {
  const enough = stats.review_count >= MIN_REVIEWS_FOR_AVERAGE;
  return (
    <div className="mt-4 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-[auto_1fr]">
      <div>
        {enough ? (
          <>
            <p className="font-display text-3xl font-semibold">{stats.avg_rating.toFixed(1)}</p>
            <StarDisplay value={stats.avg_rating} />
          </>
        ) : (
          <p className="text-sm font-medium">Too few reviews for an average</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.review_count} verified booking review{stats.review_count > 1 ? "s" : ""}
        </p>
      </div>
      {enough ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Pct label="Location matched" value={stats.location_matched_pct} />
          <Pct label="Photos accurate" value={stats.photos_accurate_pct} />
          <Pct label="Owner responsive" value={stats.owner_responsive_pct} />
        </div>
      ) : null}
    </div>
  );
}

/** Reviews section for the billboard detail page. */
export function ReviewsSection({ billboardId }: { billboardId: string }) {
  const stats = useQuery({ queryKey: ["reviews", "stats", billboardId], queryFn: () => fetchBillboardReviewStats(billboardId) });
  const list = useQuery({ queryKey: ["reviews", "billboard", billboardId], queryFn: () => fetchBillboardReviews(billboardId) });

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Reviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Only advertisers with an accepted, finished booking can review. Owners and Panorama can't edit them.
      </p>

      {stats.data ? <Summary stats={stats.data} /> : null}

      {list.isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted" />
      ) : list.error ? (
        <p className="mt-4 text-sm text-muted-foreground">Reviews are unavailable right now.</p>
      ) : !list.data?.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No reviews yet. The first advertiser to complete a booking here can leave one.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.data.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Owner's overall rating, shown next to the "Listed by" block. */
export function OwnerRating({ ownerId }: { ownerId: string }) {
  const { data } = useQuery({ queryKey: ["reviews", "owner-stats", ownerId], queryFn: () => fetchOwnerReviewStats(ownerId) });
  if (!data) return null;
  if (data.review_count < MIN_REVIEWS_FOR_AVERAGE) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {data.review_count} review{data.review_count > 1 ? "s" : ""} across all listings
      </p>
    );
  }
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm">
      <StarDisplay value={data.avg_rating} className="size-3.5" />
      <span className="font-semibold">{data.avg_rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">across {data.review_count} reviews</span>
    </p>
  );
}

/** Owner dashboard: reviews on your listings, with a one-time public reply. */
export function OwnerReviews({ ownerId }: { ownerId: string }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["reviews", "owner", ownerId], queryFn: () => fetchOwnerReviews(ownerId) });
  if (isLoading) return <div className="h-20 animate-pulse rounded-2xl bg-muted" />;
  if (error) return <p className="text-sm text-muted-foreground">Reviews are unavailable right now.</p>;
  if (!data?.length)
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No reviews yet. They appear here after an advertiser's accepted booking has finished.
      </p>
    );
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <ReviewCard key={r.id} review={r} showBillboard />
      ))}
    </ul>
  );
}
