import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import type { BillboardWithImages } from "@/lib/queries";
import { lightingLabel, availabilityLabel, dimensions, locationLine, periodShort, typeLabel } from "@/lib/domain";
import { formatCompactMoney } from "@/lib/format";
import { SaveButton } from "@/components/marketplace/SaveButton";
import { RatingBadge } from "@/components/reviews/RatingBadge";

export function coverImage(billboard: BillboardWithImages) {
  const images = [...(billboard.billboard_images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  return images[0] ?? null;
}

export function BillboardCard({ billboard }: { billboard: BillboardWithImages }) {
  const image = coverImage(billboard);
  const available = billboard.availability === "available";

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <div className="relative">
        <Link to="/billboards/$id" params={{ id: billboard.id }} className="block">
          {image ? (
            <img
              src={image.url}
              alt={image.alt_text ?? `${billboard.title} billboard in ${billboard.city}`}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center bg-muted text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </Link>
        <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
          {typeLabel(billboard.billboard_type)}
        </span>
        <SaveButton billboardId={billboard.id} />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{billboard.title}</h3>
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
              available ? "bg-brand/10 text-brand" : "bg-accent/15 text-accent-foreground"
            }`}
          >
            {availabilityLabel(billboard.availability)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{locationLine(billboard)}</p>
        <div className="mt-1.5">
          <RatingBadge stats={billboard.review_stats} />
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{dimensions(billboard)}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{lightingLabel(billboard.lighting)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="font-display text-lg font-semibold">
              {formatCompactMoney(billboard.price, billboard.currency)}
            </span>
            <span className="text-xs text-muted-foreground">{periodShort(billboard.price_period)}</span>
          </div>
          <Link
            to="/billboards/$id"
            params={{ id: billboard.id }}
            className="text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}
