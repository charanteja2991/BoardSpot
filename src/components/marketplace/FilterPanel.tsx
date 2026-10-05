import { AVAILABILITY_STATUSES, BILLBOARD_TYPES, type AvailabilityStatus, type BillboardType } from "@/lib/domain";
import type { BrowseFilters } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FilterPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: BrowseFilters;
  onChange: (next: Partial<BrowseFilters>) => void;
  onReset: () => void;
}) {
  const selectedTypes = filters.types ?? [];

  function toggleType(value: BillboardType) {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((t) => t !== value)
      : [...selectedTypes, value];
    onChange({ types: next.length ? next : undefined });
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Filters</h2>
        <button type="button" onClick={onReset} className="text-xs font-medium text-brand hover:text-brand-dark">
          Reset
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-city">City or area</Label>
        <Input
          id="filter-city"
          value={filters.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
          placeholder="Hyderabad"
        />
      </div>

      <div className="space-y-2">
        <Label>Billboard type</Label>
        <div className="flex flex-wrap gap-2">
          {BILLBOARD_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleType(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedTypes.includes(option.value)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-card hover:border-brand/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Price range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputMode="numeric"
            value={filters.minPrice ?? ""}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : null })}
            placeholder="Min"
            aria-label="Minimum price"
          />
          <Input
            inputMode="numeric"
            value={filters.maxPrice ?? ""}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : null })}
            placeholder="Max"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Minimum size</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputMode="decimal"
            value={filters.minWidth ?? ""}
            onChange={(e) => onChange({ minWidth: e.target.value ? Number(e.target.value) : null })}
            placeholder="Width"
            aria-label="Minimum width"
          />
          <Input
            inputMode="decimal"
            value={filters.minHeight ?? ""}
            onChange={(e) => onChange({ minHeight: e.target.value ? Number(e.target.value) : null })}
            placeholder="Height"
            aria-label="Minimum height"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Availability</Label>
        <div className="flex flex-wrap gap-2">
          {[{ value: "any", label: "Any" }, ...AVAILABILITY_STATUSES].map((option) => {
            const active = (filters.availability ?? "any") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ availability: option.value as AvailabilityStatus | "any" })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active ? "border-brand bg-brand/10 text-brand" : "border-border bg-card hover:border-brand/40"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(filters.illuminatedOnly)}
          onChange={(e) => onChange({ illuminatedOnly: e.target.checked || undefined })}
          className="size-4 rounded border-border accent-[var(--brand)]"
        />
        Illuminated / 24×7 lit only
      </label>
    </aside>
  );
}
