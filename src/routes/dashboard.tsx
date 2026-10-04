import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, FileText, Globe2, Inbox, Plus, CheckCircle2 } from "lucide-react";
import { OwnerGuard } from "@/components/owner/OwnerGuard";
import { useAuth } from "@/lib/auth";
import { fetchOwnerStats } from "@/lib/owner-queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — Panorama" },
      { name: "description", content: "Manage your billboard listings, drafts and booking requests on Panorama." },
      { property: "og:title", content: "Owner dashboard — Panorama" },
      { property: "og:description", content: "Manage your billboard listings, drafts and booking requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OwnerGuard>
      <DashboardPage />
    </OwnerGuard>
  ),
});

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function DashboardPage() {
  const { user, profile } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-stats", user?.id],
    queryFn: () => fetchOwnerStats(user!.id),
    enabled: Boolean(user?.id),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your listings and booking activity at a glance.</p>
        </div>
        <Button asChild>
          <Link to="/billboards/new">
            <Plus className="mr-2 size-4" /> Add billboard
          </Link>
        </Button>
      </div>

      {error ? (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          We couldn't load your numbers. Please refresh the page.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Building2 className="size-4" />} label="Total billboards" value={isLoading ? "—" : data?.total ?? 0} />
        <StatCard icon={<Globe2 className="size-4" />} label="Published" value={isLoading ? "—" : data?.published ?? 0} />
        <StatCard icon={<FileText className="size-4" />} label="Drafts / unpublished" value={isLoading ? "—" : data?.drafts ?? 0} />
        <StatCard icon={<Inbox className="size-4" />} label="Pending requests" value={isLoading ? "—" : data?.pendingRequests ?? 0} />
        <StatCard icon={<CheckCircle2 className="size-4" />} label="Accepted bookings" value={isLoading ? "—" : data?.acceptedBookings ?? 0} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link
          to="/my-billboards"
          className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand/40"
        >
          <BarChart3 className="size-5 text-brand" />
          <p className="mt-3 font-semibold">My billboards</p>
          <p className="mt-1 text-sm text-muted-foreground">Edit, publish, unpublish or remove your listings.</p>
        </Link>
        <Link to="/billboards/new" className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand/40">
          <Plus className="size-5 text-brand" />
          <p className="mt-3 font-semibold">Add a billboard</p>
          <p className="mt-1 text-sm text-muted-foreground">List a new advertising space in seven guided steps.</p>
        </Link>
        <Link
          to="/browse"
          search={{}}
          className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand/40"
        >
          <Globe2 className="size-5 text-brand" />
          <p className="mt-3 font-semibold">View public marketplace</p>
          <p className="mt-1 text-sm text-muted-foreground">See what advertisers see when they browse spaces.</p>
        </Link>
      </div>
    </div>
  );
}
