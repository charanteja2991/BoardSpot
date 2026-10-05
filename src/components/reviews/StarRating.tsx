import { Star } from "lucide-react";

/** Read-only stars, rounded to the nearest half for the fill. */
export function StarDisplay({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${className} ${value >= n - 0.25 ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </span>
  );
}

/** Keyboard-accessible 1–5 star picker. */
export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className={`size-7 transition ${value >= n ? "fill-accent text-accent" : "text-border hover:text-accent/60"}`} />
        </button>
      ))}
    </div>
  );
}
