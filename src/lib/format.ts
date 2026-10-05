export function formatMoney(amount: number | string | null | undefined, currency = "INR") {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function formatCompactMoney(amount: number | string | null | undefined, currency = "INR") {
  const value = Number(amount ?? 0);
  if (currency === "INR") {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2).replace(/\.00$/, "")}L`;
    if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return formatMoney(value, currency);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function daysBetween(start: string, end: string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}
