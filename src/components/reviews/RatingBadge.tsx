import { Star } from "lucide-react";
import { MIN_REVIEWS_FOR_AVERAGE, type ReviewStats } from "@/lib/reviews";

/** Compact rating for billboard cards. Small samples are shown as a count, not an average. */
export function RatingBadge({ stats }: { stats?: ReviewStats | null }) {
  if (!stats || stats.review_count === 0) {
    return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  }
  if (stats.review_count < MIN_REVIEWS_FOR_AVERAGE) {
    return (
      <span className="text-xs text-muted-foreground">
        {stats.review_count} review{stats.review_count > 1 ? "s" : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
      {stats.avg_rating.toFixed(1)}
      <span className="font-normal text-muted-foreground">({stats.review_count})</span>
    </span>
  );
}
