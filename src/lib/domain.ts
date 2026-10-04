import type { Database } from "@/integrations/supabase/types";

export type BillboardRow = Database["public"]["Tables"]["billboards"]["Row"];
export type BillboardImageRow = Database["public"]["Tables"]["billboard_images"]["Row"];
export type AvailabilityRow = Database["public"]["Tables"]["billboard_availability"]["Row"];
export type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type BillboardType = Database["public"]["Enums"]["billboard_type"];
export type PricePeriod = Database["public"]["Enums"]["price_period"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type DimensionUnit = Database["public"]["Enums"]["dimension_unit"];

export const BILLBOARD_TYPES: { value: BillboardType; label: string }[] = [
  { value: "highway", label: "Highway" },
  { value: "digital", label: "Digital" },
  { value: "roadside", label: "Roadside" },
  { value: "in_mall", label: "In-mall" },
  { value: "transit", label: "Transit" },
  { value: "wall_wrap", label: "Wall wrap" },
  { value: "gantry", label: "Gantry" },
  { value: "rooftop", label: "Rooftop" },
];

export const PRICE_PERIODS: { value: PricePeriod; label: string; short: string }[] = [
  { value: "daily", label: "Per day", short: "/day" },
  { value: "weekly", label: "Per week", short: "/wk" },
  { value: "monthly", label: "Per month", short: "/mo" },
  { value: "yearly", label: "Per year", short: "/yr" },
];

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
