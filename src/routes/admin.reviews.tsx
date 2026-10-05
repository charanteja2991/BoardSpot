import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { StarDisplay } from "@/components/reviews/StarRating";
import { fetchReviewsForAdmin, setReviewHidden, type AdminReviewRow } from "@/lib/reviews";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Review moderation — Panorama" }] }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const { loading, isAdmin } = useAuth();
  const [hidden, setHidden] = useState(false);

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (!isAdmin)
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is for Panorama reviewers.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Review moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hide reviews that break the rules (abuse, personal data, spam). Reviews are never deleted, and every hide needs a reason.
      </p>

      <div role="tablist" className="mt-6 inline-flex rounded-xl border border-border bg-card p-1 text-sm font-medium">
        {[
          { v: false, label: "Visible" },
          { v: true, label: "Hidden" },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={hidden === t.v}
            onClick={() => setHidden(t.v)}
            className={`rounded-lg px-4 py-1.5 transition ${hidden === t.v ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <List hidden={hidden} />
    </div>
  );
}

function List({ hidden }: { hidden: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", "admin", hidden],
    queryFn: () => fetchReviewsForAdmin(hidden),
  });

  if (isLoading) return <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />;
  if (error)
    return (
      <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load reviews."}
      </p>
    );
  if (!data?.length)
    return <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nothing here.</p>;

  return (
    <ul className="mt-6 space-y-4">
      {data.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </ul>
  );
}

function Row({ row }: { row: AdminReviewRow }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: (args: { hide: boolean; reason: string | null }) => setReviewHidden(row.id, args.hide, args.reason),
    onSuccess: (_d, v) => {
      toast.success(v.hide ? "Review hidden" : "Review restored");
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the decision."),
  });

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StarDisplay value={row.rating} />
        <Link to="/billboards/$id" params={{ id: row.billboard_id }} className="font-semibold hover:text-brand">
          {row.billboards?.title ?? "Billboard"}
        </Link>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
      </div>
      {row.comment ? <p className="mt-2 whitespace-pre-line text-sm">{row.comment}</p> : <p className="mt-2 text-sm text-muted-foreground">No comment.</p>}
      {row.owner_reply ? <p className="mt-2 rounded-lg bg-surface p-3 text-sm">Owner reply: {row.owner_reply}</p> : null}
      {row.is_hidden && row.hidden_reason ? (
        <p className="mt-2 text-sm text-destructive">Hidden: {row.hidden_reason}</p>
      ) : null}

      <div className="mt-4">
        {row.is_hidden ? (
          <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ hide: false, reason: null })}>
            Restore
          </Button>
        ) : open ? (
          <div className="space-y-2">
            <Textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for hiding (required)" />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={!reason.trim() || mutation.isPending} onClick={() => mutation.mutate({ hide: true, reason: reason.trim() })}>
                Hide review
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Hide…
          </Button>
        )}
      </div>
    </li>
  );
}
