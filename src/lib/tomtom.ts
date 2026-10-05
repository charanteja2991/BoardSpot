import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";

export function getTomTomKey(): string | undefined {
  return import.meta.env["VITE_TOMTOM_API_KEY"] as string | undefined;
}

/** Creates a TomTom map. Note: TomTom uses [lng, lat] order. */
export function createMap(container: HTMLElement, lat: number, lng: number, zoom: number) {
  const key = getTomTomKey();
  if (!key) throw new Error("TomTom key unavailable");
  const map = tt.map({ key, container, center: [lng, lat], zoom });
  map.addControl(new tt.NavigationControl(), "top-right");
  return map;
}

export { tt };
