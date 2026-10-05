import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchMyRequests, fetchOwnerRequests, setRequestStatus } from "@/lib/queries";
import { ReviewButton } from "@/components/reviews/ReviewForm";
import { fetchMyReviewedBillboardIds } from "@/lib/reviews";
import { formatDate, formatDateRange, formatMoney } from "@/lib/format";
import { periodShort } from "@/lib/domain";
import type { BookingStatus } from "@/lib/domain";

const STYLES: Record<string, string> = {
  pending: "bg-accent/20 text-foreground",
  accepted: "bg-brand/10 text-brand",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function RequestsList({ userId, as }: { userId: string; as: "owner" | "advertiser" }) {
  const queryClient = useQueryClient();
  const key = ["requests", as, userId];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => (as === "owner" ? fetchOwnerRequests(userId) : fetchMyRequests(userId)),
  });
  // Billboards this advertiser has already reviewed (one review per billboard).
  const { data: reviewedIds } = useQuery({
    queryKey: ["reviews", "mine", userId],
    queryFn: () => fetchMyReviewedBillboardIds(userId),
    enabled: as === "advertiser",
  });
  const today = new Date().toISOString().slice(0, 10);
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => setRequestStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["owner-stats"] });
      toast.success("Request updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the request"),
  });

  if (isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  if (!data?.length)
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {as === "owner" ? "No booking requests yet." : "You haven't requested any billboards yet."}
      </p>
    );

  return (
    <ul className="space-y-3">
      {data.map((r: any) => (
        <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {r.billboards ? (
                <Link to="/billboards/$id" params={{ id: r.billboards.id }} className="font-semibold hover:text-brand">
                  {r.billboards.title}
                </Link>
              ) : (
                <span className="font-semibold">Billboard</span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[r.status] ?? ""}`}>{r.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateRange(r.start_date, r.end_date)}</p>
            {r.billboards ? (
              <p className="text-sm text-muted-foreground">
                {formatMoney(r.billboards.price, r.billboards.currency)} {periodShort(r.billboards.price_period)}
              </p>
            ) : null}
            {r.message ? <p className="mt-2 text-sm">{r.message}</p> : null}
            {as === "advertiser" && r.status === "accepted" && r.end_date >= today ? (
              <p className="mt-2 text-xs text-muted-foreground">You can review this billboard once the booking ends on {formatDate(r.end_date)}.</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {as === "owner" && r.status === "pending" ? (
              <>
                <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: r.id, status: "accepted" })}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: r.id, status: "rejected" })}>
                  Reject
                </Button>
              </>
            ) : null}
            {as === "advertiser" && r.status === "accepted" && r.end_date < today ? (
              reviewedIds?.has(r.billboard_id) ? (
                <span className="self-center text-xs font-medium text-muted-foreground">Reviewed</span>
              ) : (
                <ReviewButton bookingId={r.id} billboardTitle={r.billboards?.title ?? "this billboard"} />
              )
            ) : null}
            {as === "advertiser" && r.status === "pending" ? (
              <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: r.id, status: "cancelled" })}>
                Cancel
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
