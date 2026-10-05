import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { BillboardCard } from "@/components/marketplace/BillboardCard";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { fetchPublicBillboards, type BrowseFilters } from "@/lib/queries";
import type { BillboardType } from "@/lib/domain";

type BrowseSearch = { q?: string; max?: number; type?: BillboardType };

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? String(search["q"]) : undefined,
    max: Number.isFinite(Number(search["max"])) && search["max"] ? Number(search["max"]) : undefined,
    type: typeof search["type"] === "string" ? (search["type"] as BillboardType) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse billboards for rent — Panorama" },
      {
        name: "description",
        content:
          "Search hoardings, digital screens and transit media by city, size, price and availability. No account needed to browse.",
      },
      { property: "og:title", content: "Browse billboards for rent — Panorama" },
      {
        property: "og:description",
        content: "Search outdoor advertising spaces by city, size, price and availability.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const [panelOpen, setPanelOpen] = useState(false);

  const [filters, setFilters] = useState<BrowseFilters>(() => ({
    q: search.q,
    maxPrice: search.max ?? null,
    types: search.type ? [search.type] : undefined,
    availability: "any",
    sort: "recent",
  }));

  const query = useQuery({
    queryKey: ["public-billboards", filters],
    queryFn: () => fetchPublicBillboards(filters),
  });

  const results = query.data ?? [];
  const heading = useMemo(() => {
    const city = filters.city?.trim() || filters.q?.trim();
    return city ? `Billboards in ${city}` : "All billboards";
  }, [filters.city, filters.q]);

  function update(next: Partial<BrowseFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
    if ("q" in next) navigate({ search: (prev) => ({ ...prev, q: next.q || undefined }) });
  }

  function reset() {
    setFilters({ availability: "any", sort: "recent" });
    navigate({ search: {} });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query.isLoading ? "Loading listings…" : `${results.length} listing${results.length === 1 ? "" : "s"} available`}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className={panelOpen ? "block" : "hidden lg:block"}>
          <FilterPanel filters={filters} onChange={update} onReset={reset} />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters
            </button>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select
                value={filters.sort ?? "recent"}
                onChange={(e) => update({ sort: e.target.value as BrowseFilters["sort"] })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <option value="recent">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {query.isError ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              We couldn't load listings right now. Please try again.
            </p>
          ) : query.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-muted" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <h2 className="font-display text-lg font-semibold">No billboards match this search</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Try widening your price range or clearing a few filters — new spaces are published regularly.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((billboard) => (
                <BillboardCard key={billboard.id} billboard={billboard} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
