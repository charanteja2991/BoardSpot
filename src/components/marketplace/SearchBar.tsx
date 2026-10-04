import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, IndianRupee } from "lucide-react";
import { BILLBOARD_TYPES, type BillboardType } from "@/lib/domain";

/** Public search entry point — no account required. */
export function SearchBar() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState<BillboardType | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/browse",
      search: {
        q: city.trim() || undefined,
        max: maxPrice ? Number(maxPrice) : undefined,
        type: type ?? undefined,
      },
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-panel)]">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-surface px-4 py-3">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City, area or road"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="City, area or road…"
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-surface px-4 py-3">
          <IndianRupee className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            aria-label="Maximum price per period"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Max price / month"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-95"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {BILLBOARD_TYPES.slice(0, 4).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setType(type === option.value ? null : option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              type === option.value ? "border-brand bg-brand/10 text-brand" : "border-border bg-card hover:border-brand/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
