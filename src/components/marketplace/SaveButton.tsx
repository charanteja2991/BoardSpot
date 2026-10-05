import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { fetchSavedIds, toggleSaved } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function useSavedIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-ids", user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function SaveButton({
  billboardId,
  variant = "icon",
  className,
}: {
  billboardId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { user, requireAuth } = useAuth();
  const queryClient = useQueryClient();
  const { data: savedIds } = useSavedIds();
  const saved = savedIds?.has(billboardId) ?? false;

  const mutation = useMutation({
    mutationFn: () => toggleSaved(user!.id, billboardId, saved),
    onSuccess: (nowSaved) => {
      queryClient.invalidateQueries({ queryKey: ["saved-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-billboards"] });
      toast.success(nowSaved ? "Saved to your list" : "Removed from saved");
    },
    onError: () => toast.error("Could not update your saved list"),
  });

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    requireAuth(
      {
        title: "Sign in to save this billboard",
        description: "Keep a shortlist of the spaces you like and come back to them anytime.",
      },
      () => mutation.mutate(),
    );
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold transition-colors hover:border-brand/40",
          saved && "border-brand/50 text-brand",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-brand text-brand")} />
        {saved ? "Saved" : "Save billboard"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save billboard"}
      onClick={handleClick}
      className={cn(
        "absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/95 text-muted-foreground shadow-sm transition-colors hover:text-foreground",
        saved && "text-brand",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-brand text-brand")} />
    </button>
  );
}
