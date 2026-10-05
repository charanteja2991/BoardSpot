import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Ruler, Sun, CalendarDays, ExternalLink } from "lucide-react";
import { fetchBillboardDetail } from "@/lib/queries";
import {
  lightingLabel,
  availabilityLabel,
  dimensions,
  googleMapsUrl,
  locationLine,
  periodLabel,
  typeLabel,
} from "@/lib/domain";
import { formatDate, formatMoney } from "@/lib/format";
import { BookingRequestForm } from "@/components/marketplace/BookingRequestForm";
import { BillboardMap } from "@/components/marketplace/BillboardMap";
import { SaveButton } from "@/components/marketplace/SaveButton";
import { coverImage } from "@/components/marketplace/BillboardCard";
import { OwnerRating, ReviewsSection } from "@/components/reviews/ReviewList";

export const Route = createFileRoute("/billboards/$id")({
  head: () => ({
    meta: [
      { title: "Billboard details — Panorama" },
      { name: "description", content: "Location, size, lighting, pricing and availability for this advertising space." },
      { property: "og:title", content: "Billboard details — Panorama" },
      {
        property: "og:description",
        content: "Location, size, lighting, pricing and availability for this advertising space.",
      },
    ],
  }),
  component: BillboardDetail,
});

function BillboardDetail() {
  const { id } = Route.useParams();
  const query = useQuery({ queryKey: ["billboard", id], queryFn: () => fetchBillboardDetail(id) });

  if (query.isLoading) {
    return <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl bg-muted px-4" />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">This billboard isn't available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been unpublished by its owner. Browse other spaces instead.
        </p>
        <Link
          to="/browse"
          search={{}}
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          Browse billboards
        </Link>
      </div>
    );
  }

  const { billboard, owner } = query.data;
  const cover = coverImage(billboard);
  const gallery = [...(billboard.billboard_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const lat = Number(billboard.latitude);
  const lng = Number(billboard.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/browse" search={{}} className="text-sm font-medium text-brand hover:text-brand-dark">
        ← Back to browse
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{billboard.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {billboard.address ? `${billboard.address}, ` : ""}
            {locationLine(billboard)}
          </p>
        </div>
        <SaveButton billboardId={billboard.id} variant="full" className="relative right-auto top-auto" />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {cover ? (
            <img
              src={cover.url}
              alt={cover.alt_text ?? `${billboard.title} in ${billboard.city}`}
              className="aspect-[16/9] w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="grid aspect-[16/9] w-full place-items-center rounded-2xl bg-muted text-sm text-muted-foreground">
              No photo provided
            </div>
          )}

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt_text ?? billboard.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">About this space</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {billboard.description || "The owner hasn't added a description yet."}
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <Fact icon={<Ruler className="size-4" />} label="Size" value={dimensions(billboard)} />
              <Fact icon={<Sun className="size-4" />} label="Lighting" value={lightingLabel(billboard.lighting)} />
              <Fact icon={<CalendarDays className="size-4" />} label="Type" value={typeLabel(billboard.billboard_type)} />
            </dl>
          </section>

          <ReviewsSection billboardId={billboard.id} />

          {hasCoords && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Location & street view</h2>
                <a
                  href={googleMapsUrl(lat, lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
                >
                  Open in Maps <ExternalLink className="size-3.5" />
                </a>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="h-64">
                  <BillboardMap lat={lat} lng={lng} title={billboard.title} />
                </div>
                <div className="h-64">
                  <BillboardMap lat={lat} lng={lng} title={billboard.title} mode="street" />
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]">
            <p className="font-display text-3xl font-semibold">
              {formatMoney(billboard.price, billboard.currency)}
            </p>
            <p className="text-sm text-muted-foreground">{periodLabel(billboard.price_period)}</p>
            <span className="mt-4 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {availabilityLabel(billboard.availability)}
            </span>
            <BookingRequestForm billboard={billboard} />
          </div>

          {(billboard.available_from || billboard.available_to) && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold">Availability window</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {billboard.available_from ? formatDate(billboard.available_from) : "Now"} →{" "}
                {billboard.available_to ? formatDate(billboard.available_to) : "Open-ended"}
              </p>
            </div>
          )}

          {owner && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold">Listed by</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="font-medium">{owner.company_name || owner.display_name || "Billboard owner"}</p>
              </div>
              <OwnerRating ownerId={billboard.owner_id} />
              {owner.bio && <p className="mt-1 text-sm text-muted-foreground">{owner.bio}</p>}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
