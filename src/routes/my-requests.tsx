import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { RequestsList } from "@/components/marketplace/RequestsList";

export const Route = createFileRoute("/my-requests")({ component: MyRequestsPage });

function MyRequestsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { redirect: "/my-requests" }, replace: true });
  }, [loading, user, navigate]);

  if (!user)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">My booking requests</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Requests you've sent to billboard owners.</p>
      <RequestsList userId={user.id} as="advertiser" />
    </div>
  );
}
