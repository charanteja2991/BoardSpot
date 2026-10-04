import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ensureOwnerRole } from "@/lib/owner-queries";

/**
 * Client-side gate for owner-only pages. Public browsing stays open; only these
 * pages require a session, and only the owner role may pass.
 */
export function OwnerGuard({ children }: { children: ReactNode }) {
  const { user, loading, isOwner, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const [claiming, setClaiming] = useState(false);
  // Remember where the visitor was headed the first time we render, so the
  // redirect target never picks up an /auth URL from a later render.
  const intended = useRef(href);
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirected.current && !intended.current.startsWith("/auth")) {
      redirected.current = true;
      void navigate({ to: "/auth", search: { redirect: intended.current }, replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isOwner && !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Owner area</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This section is for billboard owners. Switch your account to an owner account to list and manage
          advertising spaces.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                await ensureOwnerRole(user.id);
                await refreshProfile();
                toast.success("Owner access enabled");
              } catch {
                toast.error("Could not enable owner access. Please try again.");
              } finally {
                setClaiming(false);
              }
            }}
          >
            {claiming ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Become an owner
          </Button>
          <Button variant="outline" asChild>
            <Link to="/browse" search={{}}>
              Browse billboards
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
