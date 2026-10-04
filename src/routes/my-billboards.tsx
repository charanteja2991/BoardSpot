import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarRange, ExternalLink, ImageOff, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { OwnerGuard } from "@/components/owner/OwnerGuard";
import { useAuth } from "@/lib/auth";
import { fetchMyBillboards } from "@/lib/queries";
import { coverImage } from "@/components/marketplace/BillboardCard";
import { deleteBillboard, setBillboardStatus } from "@/lib/owner-queries";
import { dimensions, locationLine, periodShort, typeLabel } from "@/lib/domain";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/my-billboards")({
  head: () => ({
    meta: [
      { title: "My billboards — Panorama" },
      { name: "description", content: "Review, edit, publish or remove the billboard spaces you list on Panorama." },
      { property: "og:title", content: "My billboards — Panorama" },
      { property: "og:description", content: "Review, edit, publish or remove your billboard listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OwnerGuard>
      <MyBillboardsPage />
    </OwnerGuard>
  ),
});

const STATUS_STYLES: Record<string, string> = {
  published: "bg-brand/10 text-brand",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-accent/20 text-foreground",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-destructive/10 text-destructive",
};

function MyBillboardsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-billboards", user?.id],
    queryFn: () => fetchMyBillboards(user!.id),
    enabled: Boolean(user?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-billboards", user?.id] });
    void queryClient.invalidateQueries({ queryKey: ["owner-stats", user?.id] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "published" | "draft" }) => setBillboardStatus(id, status),
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "published" ? "Billboard published" : "Billboard unpublished");
      invalidate();
    },
    onError: () => toast.error("That change didn't go through. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBillboard(id),
    onSuccess: () => {
      toast.success("Billboard deleted");
      setPendingDelete(null);
      invalidate();
    },
    onError: () => toast.error("We couldn't delete this billboard. Please try again."),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My billboards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Only you can see and manage these listings.</p>
        </div>
        <Button asChild>
          <Link to="/billboards/new">
            <Plus className="mr-2 size-4" /> Add billboard
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          We couldn't load your listings. Please refresh the page.
        </p>
      ) : !data?.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first advertising space to start receiving requests.</p>
          <Button className="mt-5" asChild>
            <Link to="/billboards/new">
              <Plus className="mr-2 size-4" /> Add billboard
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {data.map((b) => {
            const image = coverImage(b);
            
            return (
              <div key={b.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row">
                <div className="h-36 w-full overflow-hidden rounded-xl bg-muted sm:w-52">
                  {image ? (
                    <img src={image.url} alt={image.alt_text ?? b.title} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{b.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.status}
                    </span>
                    {!b.is_visible ? (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">Hidden</span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {locationLine(b)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {typeLabel(b.billboard_type)} · {dimensions(b)} · {b.is_illuminated ? "Illuminated" : "Non-illuminated"}
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatMoney(b.price, b.currency)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{periodShort(b.price_period)}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarRange className="size-3.5" />
                    Availability: <span className="capitalize">{b.availability}</span>
                  </p>
                </div>

                <div className="flex flex-row flex-wrap items-start gap-2 sm:flex-col">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/billboards/$id/edit" params={{ id: b.id }}>
                      <Pencil className="mr-2 size-3.5" /> Edit
                    </Link>
                  </Button>
                  {b.status === "published" ? (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/billboards/$id" params={{ id: b.id }}>
                          <ExternalLink className="mr-2 size-3.5" /> View public
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: b.id, status: "draft" })}
                      >
                        Unpublish
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: b.id, status: "published" })}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDelete({ id: b.id, title: b.title })}
                  >
                    <Trash2 className="mr-2 size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the listing, its photos and availability. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
