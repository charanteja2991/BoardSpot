/**
 * Minimal Maps JavaScript API loader.
 * Uses the publishable browser key; all Places work (if ever added) must go
 * through an authenticated backend function instead.
 */

declare global {
  interface Window {
    google?: typeof google;
    __panoramaMapsReady?: () => void;
  }
}

let loaderPromise: Promise<typeof google> | null = null;

export function getBrowserMapsKey(): string | undefined {
  return import.meta.env["VITE_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("Maps can only load in the browser"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  const key = getBrowserMapsKey();
  if (!key) return Promise.reject(new Error("Google Maps key unavailable"));

  const channel = (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined) ?? "";

  loaderPromise = new Promise<typeof google>((resolve, reject) => {
    window.__panoramaMapsReady = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps failed to initialise"));
    };
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&loading=async&callback=__panoramaMapsReady` +
      (channel ? `&channel=${encodeURIComponent(channel)}` : "");
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
