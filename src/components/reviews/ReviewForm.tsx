import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StarInput } from "@/components/reviews/StarRating";
import { createReview, MAX_COMMENT } from "@/lib/reviews";

type Answer = boolean | null;

const CHECKS = [
  { key: "location_matched", label: "Did the location match the listing?" },
  { key: "photos_accurate", label: "Were the photos accurate?" },
  { key: "owner_responsive", label: "Did the owner respond promptly?" },
] as const;

function Choice({ label, value, onChange }: { label: string; value: Answer; onChange: (v: Answer) => void }) {
  const opts: { text: string; v: Answer }[] = [
    { text: "Yes", v: true },
    { text: "No", v: false },
    { text: "Skip", v: null },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border p-0.5 text-xs font-medium">
        {opts.map((o) => (
          <button
            key={o.text}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-md px-3 py-1 transition ${value === o.v ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Leave a review" button + dialog for one finished, accepted booking. */
export function ReviewButton({ bookingId, billboardTitle }: { bookingId: string; billboardTitle: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [checks, setChecks] = useState<Record<(typeof CHECKS)[number]["key"], Answer>>({
    location_matched: null,
    photos_accurate: null,
    owner_responsive: null,
  });
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => createReview({ booking_id: bookingId, rating, ...checks, comment }),
    onSuccess: () => {
      toast.success("Thanks — your review is live.");
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post your review."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Star className="mr-1.5 size-4" /> Leave a review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {billboardTitle}</DialogTitle>
          <DialogDescription>
            Shown publicly as a verified booking, with your first name and last initial. Reviews can't be edited after posting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-1 text-sm font-medium">Overall rating</p>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div className="space-y-3 rounded-xl bg-surface p-4">
            {CHECKS.map((c) => (
              <Choice key={c.key} label={c.label} value={checks[c.key]} onChange={(v) => setChecks((s) => ({ ...s, [c.key]: v }))} />
            ))}
          </div>

          <div>
            <label htmlFor={`comment-${bookingId}`} className="mb-1 block text-sm font-medium">
              Comment <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id={`comment-${bookingId}`}
              value={comment}
              maxLength={MAX_COMMENT}
              rows={4}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What should the next advertiser know?"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {comment.length}/{MAX_COMMENT}
            </p>
          </div>

          <Button className="w-full" disabled={rating === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Posting…" : "Post review"}
          </Button>
          {rating === 0 ? <p className="-mt-3 text-center text-xs text-muted-foreground">Choose a star rating to continue.</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
