export type BillboardType = "static" | "digital" | "mobile" | "poster";
export type PricePeriod = "day" | "week" | "month";
export type ListingStatus = "draft" | "published" | "unpublished";
export type AvailabilityStatus = "available" | "booked" | "unavailable";
export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type AppRole = "advertiser" | "owner";
export type Lighting = "none" | "frontlit" | "backlit";
export type DimensionUnit = "ft";

/** UI-facing billboard shape, mapped from the `billboards` table (see lib/queries.ts). */
export type BillboardRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  billboard_type: BillboardType;
  address: string;
  area: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  dimension_unit: DimensionUnit;
  lighting: Lighting;
  is_illuminated: boolean;
  price: number;
  currency: string;
  price_period: PricePeriod;
  availability: AvailabilityStatus;
  status: ListingStatus;
  is_visible: boolean;
  available_from: string | null;
  available_to: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  display_name: string;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: AppRole;
};

export const BILLBOARD_TYPES: { value: BillboardType; label: string }[] = [
  { value: "static", label: "Static" },
  { value: "digital", label: "Digital" },
  { value: "mobile", label: "Mobile" },
  { value: "poster", label: "Poster" },
];

export const PRICE_PERIODS: { value: PricePeriod; label: string; short: string }[] = [
  { value: "day", label: "Per day", short: "/day" },
  { value: "week", label: "Per week", short: "/wk" },
  { value: "month", label: "Per month", short: "/mo" },
];

export const LIGHTING_OPTIONS: { value: Lighting; label: string }[] = [
  { value: "none", label: "Non-lit" },
  { value: "frontlit", label: "Front-lit" },
  { value: "backlit", label: "Back-lit" },
];

export function lightingLabel(value: Lighting | null | undefined) {
  return LIGHTING_OPTIONS.find((l) => l.value === value)?.label ?? "Non-lit";
}

export const AVAILABILITY_STATUSES: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "unavailable", label: "Unavailable" },
];

export function typeLabel(value: BillboardType) {
  return BILLBOARD_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function periodShort(value: PricePeriod) {
  return PRICE_PERIODS.find((p) => p.value === value)?.short ?? "";
}

export function periodLabel(value: PricePeriod) {
  return PRICE_PERIODS.find((p) => p.value === value)?.label ?? value;
}

export function availabilityLabel(value: AvailabilityStatus) {
  return AVAILABILITY_STATUSES.find((a) => a.value === value)?.label ?? value;
}

export function dimensions(b: Pick<BillboardRow, "width" | "height" | "dimension_unit">) {
  const w = Number(b.width);
  const h = Number(b.height);
  const strip = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return `${strip(w)}${b.dimension_unit} × ${strip(h)}${b.dimension_unit}`;
}

export function locationLine(b: Pick<BillboardRow, "area" | "city" | "state">) {
  return [b.area, b.city, b.state].filter(Boolean).join(", ");
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function streetViewUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}
