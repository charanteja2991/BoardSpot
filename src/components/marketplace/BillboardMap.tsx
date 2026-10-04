import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

type Props = { lat: number; lng: number; title: string; mode?: "map" | "street" };

export function BillboardMap({ lat, lng, title, mode = "map" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        const position = { lat, lng };
        if (mode === "street") {
          new google.maps.StreetViewPanorama(ref.current, {
            position,
            pov: { heading: 0, pitch: 0 },
            addressControl: false,
            fullscreenControl: false,
          });
        } else {
          const map = new google.maps.Map(ref.current, {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
          });
          new google.maps.Marker({ map, position, title });
        }
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, title, mode]);

  if (failed) {
    return (
      <div className="grid h-full min-h-56 w-full place-items-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground">
        {mode === "street" ? "Street View" : "Map"} is unavailable right now.
      </div>
    );
  }

  return <div ref={ref} className="h-full min-h-56 w-full rounded-xl bg-muted" aria-label={`${title} ${mode}`} />;
}
