import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, MapPinned, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { BillboardCard } from "@/components/marketplace/BillboardCard";
import { fetchFeaturedBillboards, fetchPopularCities } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panorama — Rent billboards & outdoor advertising space" },
      {
        name: "description",
        content:
          "Find hoardings, digital screens and transit media across India. Compare location, size and price, then request a booking directly with the owner.",
      },
      { property: "og:title", content: "Panorama — Rent billboards & outdoor advertising space" },
      {
        property: "og:description",
        content: "Browse verified billboards by city, size and price, and book directly with owners.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = useQuery({ queryKey: ["featured-billboards"], queryFn: () => fetchFeaturedBillboards(6) });
  const cities = useQuery({ queryKey: ["popular-cities"], queryFn: fetchPopularCities });

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Outdoor advertising marketplace</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Find the billboard your campaign deserves.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Browse hoardings, digital screens and transit media from verified owners. No account needed to look around.
          </p>
          <div className="mt-8 max-w-3xl">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Featured spaces</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recently published listings from across the network.</p>
          </div>
          <Link to="/browse" search={{}} className="text-sm font-semibold text-brand hover:text-brand-dark">
            View all →
          </Link>
        </div>

        {featured.isLoading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (featured.data?.length ?? 0) === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <h3 className="font-display text-lg font-semibold">Listings are on the way</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              No billboards have been published yet. As soon as owners publish their spaces, they'll appear here and in
              search.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data!.map((billboard) => (
              <BillboardCard key={billboard.id} billboard={billboard} />
            ))}
          </div>
        )}
      </section>

      {(cities.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="font-display text-2xl font-semibold">Popular cities</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {cities.data!.map((entry) => (
              <Link
                key={entry.city}
                to="/browse"
                search={{ q: entry.city }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-brand/40"
              >
                {entry.city}
                <span className="ml-2 text-xs text-muted-foreground">{entry.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
          <Highlight
            icon={<MapPinned className="size-5" />}
            title="See it before you book"
            body="Every listing pins the exact location with map and Street View context."
          />
          <Highlight
            icon={<ShieldCheck className="size-5" />}
            title="Owner-verified details"
            body="Sizes, lighting and availability come straight from the space owner."
          />
          <Highlight
            icon={<Sparkles className="size-5" />}
            title="Browse without signing up"
            body="An account is only needed to save a space or send a booking request."
          />
        </div>
      </section>
    </div>
  );
}

function Highlight({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</span>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
