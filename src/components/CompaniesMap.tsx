"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Map as MapIcon, TriangleAlert } from "lucide-react";
import { readTheme } from "@/lib/theme";

// Sydney CBD. The directory is Australia-focused, so a map with nothing plotted
// should still open somewhere deliberate rather than mid-ocean at zoom 0.
export const SYDNEY: google.maps.LatLngLiteral = { lat: -33.8688, lng: 151.2093 };
const DEFAULT_ZOOM = 11;
const SELECTED_ZOOM = 14;

export type MapCompany = {
  name: string;
  location: string;
  lat: number;
  lng: number;
};

// A missing key is derived from the prop rather than stored, so the effect
// never has to setState synchronously just to describe its own input.
type LoadState = "loading" | "ready" | "error";

declare global {
  interface Window {
    __jobosMapsReady?: () => void;
  }
}

// One shared loader for the whole app: the Maps script must only ever be
// injected once, and React can mount this component more than once.
let loaderPromise: Promise<void> | null = null;

const READY_CALLBACK = "__jobosMapsReady";
const LOAD_TIMEOUT_MS = 15_000;

async function bootstrapMaps(apiKey: string): Promise<void> {
  if (window.google?.maps?.Map) return;

  await new Promise<void>((resolve, reject) => {
    // `callback` is the only readiness signal Google guarantees. The script's
    // own onload fires while google.maps is still a partial stub — at that
    // point both `new google.maps.Map` and `importLibrary` throw, which is
    // exactly how this first went wrong.
    const timer = setTimeout(
      () => reject(new Error("Google Maps did not become ready in time")),
      LOAD_TIMEOUT_MS,
    );
    window[READY_CALLBACK] = () => {
      clearTimeout(timer);
      resolve();
    };

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      callback: READY_CALLBACK,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(script);
  });
}

function loadMapsApi(apiKey: string): Promise<void> {
  if (!loaderPromise) {
    loaderPromise = bootstrapMaps(apiKey).catch((error: unknown) => {
      // Clear the cache so a later mount can retry; a rejected promise would
      // otherwise poison every subsequent attempt for the whole session.
      loaderPromise = null;
      throw error;
    });
  }
  return loaderPromise;
}

export default function CompaniesMap({
  apiKey,
  companies,
  selectedName,
  onSelect,
  plottedOf,
}: {
  apiKey: string | null;
  companies: MapCompany[];
  selectedName: string;
  onSelect: (name: string) => void;
  plottedOf: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const [state, setState] = useState<LoadState>("loading");

  const handleSelect = useCallback((name: string) => onSelect(name), [onSelect]);

  // Create the map once the script is in.
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    loadMapsApi(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: SYDNEY,
          zoom: DEFAULT_ZOOM,
          // Keep the map from fighting the surrounding UI: the chat widget sits
          // bottom-right, so move Google's controls out of its way.
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
          colorScheme: readTheme() === "dark" ? "DARK" : "LIGHT",
        });
        setState("ready");
      })
      .catch((error: unknown) => {
        // Log it: a silent catch here is what made the loader race invisible
        // during development.
        console.error("Google Maps failed to initialise", error);
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Sync markers to the company list.
  useEffect(() => {
    const map = mapRef.current;
    if (state !== "ready" || !map) return;

    const markers = markersRef.current;
    const wanted = new Set(companies.map((c) => c.name));

    for (const [name, marker] of markers) {
      if (!wanted.has(name)) {
        marker.setMap(null);
        markers.delete(name);
      }
    }

    for (const company of companies) {
      const existing = markers.get(company.name);
      if (existing) {
        existing.setPosition({ lat: company.lat, lng: company.lng });
        continue;
      }
      const marker = new google.maps.Marker({
        map,
        position: { lat: company.lat, lng: company.lng },
        title: `${company.name} — ${company.location}`,
      });
      marker.addListener("click", () => handleSelect(company.name));
      markers.set(company.name, marker);
    }

    // Frame everything that is plotted; fall back to Sydney when nothing is.
    if (companies.length === 0) {
      map.setCenter(SYDNEY);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }
    if (companies.length === 1) {
      map.setCenter({ lat: companies[0].lat, lng: companies[0].lng });
      map.setZoom(SELECTED_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const company of companies) bounds.extend({ lat: company.lat, lng: company.lng });
    map.fitBounds(bounds, 48);
  }, [companies, state, handleSelect]);

  // Follow the list selection.
  useEffect(() => {
    const map = mapRef.current;
    if (state !== "ready" || !map) return;
    const target = companies.find((c) => c.name === selectedName);
    if (!target) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    if ((map.getZoom() ?? DEFAULT_ZOOM) < SELECTED_ZOOM) map.setZoom(SELECTED_ZOOM);
  }, [selectedName, companies, state]);

  // Tear down on unmount so a remount does not leak markers onto a stale map.
  // The Map instance is created once by useRef, so capturing it here is safe and
  // avoids reading a ref that may have moved on by cleanup time.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
      mapRef.current = null;
    };
  }, []);

  if (!apiKey || state === "error") {
    const isKeyProblem = !apiKey;
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-secondary">
        <div className="max-w-sm px-6 text-center">
          {isKeyProblem
            ? <MapIcon size={44} className="mx-auto mb-3 text-border-hover" />
            : <TriangleAlert size={44} className="mx-auto mb-3 text-red-500" />}
          <p className="font-bold text-text-heading">
            {isKeyProblem ? "Map not configured" : "Map could not load"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {isKeyProblem
              ? "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show employers on a map. The list beside this panel works without it."
              : "Google Maps did not respond. Check the API key's referrer restrictions and that the Maps JavaScript API is enabled."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
          <p className="text-sm text-text-muted">Loading map…</p>
        </div>
      )}
      {state === "ready" && companies.length === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-border-light bg-bg-card/95 px-4 py-2 text-center shadow-md">
          <p className="text-xs font-bold text-text-heading">
            {plottedOf === 0 ? "No employers to plot yet" : `None of ${plottedOf} employers have coordinates yet`}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">Showing Sydney by default.</p>
        </div>
      )}
    </div>
  );
}
