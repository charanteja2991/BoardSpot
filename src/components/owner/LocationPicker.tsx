import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }; // Mumbai

/** Click-to-place map picker for a billboard's exact coordinates. */
export function LocationPicker({ lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current || mapRef.current) return;
        const center = lat != null && lng != null ? { lat, lng } : DEFAULT_CENTER;
        const map = new google.maps.Map(ref.current, {
          center,
          zoom: lat != null ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        if (lat != null && lng != null) {
          markerRef.current = new google.maps.Marker({ map, position: { lat, lng }, draggable: true });
          markerRef.current.addListener("dragend", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) onChange(e.latLng.lat(), e.latLng.lng());
          });
        }
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          if (markerRef.current) markerRef.current.setPosition(position);
          else {
            markerRef.current = new google.maps.Marker({ map, position, draggable: true });
            markerRef.current.addListener("dragend", (ev: google.maps.MapMouseEvent) => {
              if (ev.latLng) onChange(ev.latLng.lat(), ev.latLng.lng());
            });
          }
          onChange(position.lat, position.lng);
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // Map is created once; marker updates happen through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;
    const position = { lat, lng };
    if (markerRef.current) markerRef.current.setPosition(position);
    mapRef.current.setCenter(position);
  }, [lat, lng]);

  if (failed) {
    return (
      <div className="grid h-64 place-items-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground">
        The map is unavailable right now — enter the coordinates manually.
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} className="h-64 w-full rounded-xl bg-muted" aria-label="Pick the billboard location" />
      <p className="mt-2 text-xs text-muted-foreground">
        Tap the map to drop a pin, or drag the pin to fine-tune the exact spot.
      </p>
    </div>
  );
}
