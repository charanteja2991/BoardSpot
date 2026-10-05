import { useEffect, useRef, useState } from "react";
import type { Map as TTMap, Marker } from "@tomtom-international/web-sdk-maps";
import { createMap, tt } from "@/lib/tomtom";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 }; // Hyderabad

/** Click-to-place map picker for a billboard's exact coordinates. */
export function LocationPicker({ lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<TTMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    try {
      const center = lat != null && lng != null ? { lat, lng } : DEFAULT_CENTER;
      const map = createMap(ref.current, center.lat, center.lng, lat != null ? 15 : 11);
      mapRef.current = map;

      const placeMarker = (la: number, ln: number) => {
        if (markerRef.current) {
          markerRef.current.setLngLat([ln, la]);
          return;
        }
        const marker = new tt.Marker({ draggable: true }).setLngLat([ln, la]).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLngLat();
          onChangeRef.current(p.lat, p.lng);
        });
        markerRef.current = marker;
      };

      if (lat != null && lng != null) placeMarker(lat, lng);
      map.on("click", (e) => {
        placeMarker(e.lngLat.lat, e.lngLat.lng);
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
      });
    } catch {
      setFailed(true);
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin in sync when coordinates are typed in manually.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;
    if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
    else {
      const marker = new tt.Marker({ draggable: true }).setLngLat([lng, lat]).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLngLat();
        onChangeRef.current(p.lat, p.lng);
      });
      markerRef.current = marker;
    }
    map.setCenter([lng, lat]);
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
      <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl bg-muted" aria-label="Pick the billboard location" />
      <p className="mt-2 text-xs text-muted-foreground">
        Tap the map to drop a pin, or drag the pin to fine-tune the exact spot.
      </p>
    </div>
  );
}
