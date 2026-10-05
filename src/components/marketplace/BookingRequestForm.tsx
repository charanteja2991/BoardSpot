import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingRequest } from "@/lib/queries";
import type { BillboardRow } from "@/lib/domain";

export function BookingRequestForm({ billboard }: { billboard: BillboardRow }) {
  const { user, requireAuth } = useAuth();
  const [start, setStart] = useState(billboard.available_from ?? "");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createBookingRequest({
        billboard_id: billboard.id,
        advertiser_id: user!.id,
        owner_id: billboard.owner_id,
        start_date: start,
        end_date: end,
        message: message.trim() || null,
      }),
    onSuccess: () => {
      setSent(true);
      toast.success("Booking request sent");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send your request"),
  });

  if (user?.id === billboard.owner_id) {
    return <p className="mt-4 text-xs text-muted-foreground">This is your own listing.</p>;
  }
  if (sent) {
    return (
      <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
        Request sent. Track it under{" "}
        <Link to="/my-requests" className="font-medium text-brand">
          My requests
        </Link>
        .
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) {
      toast.error("Choose a start and end date.");
      return;
    }
    if (end < start) {
      toast.error("The end date can't be before the start date.");
      return;
    }
    if (billboard.available_from && start < billboard.available_from) {
      toast.error("Your dates start before this space becomes available.");
      return;
    }
    if (billboard.available_to && end > billboard.available_to) {
      toast.error("Your dates run past the end of this space's availability.");
      return;
    }
    requireAuth(
      { title: "Sign in to request a booking", description: "Send a booking request to the owner of this space." },
      () => mutation.mutate(),
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="bk-start">Start date</Label>
          <Input id="bk-start" type="date" value={start} min={billboard.available_from ?? undefined} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bk-end">End date</Label>
          <Input id="bk-end" type="date" value={end} max={billboard.available_to ?? undefined} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bk-msg">Message (optional)</Label>
        <Textarea id="bk-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell the owner about your campaign" />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Request booking
      </Button>
    </form>
  );
}
