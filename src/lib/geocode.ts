import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getGeocodingApiKey } from "@/lib/env";

export type Coordinates = { latitude: number; longitude: number };

// Bounds a single ingestion run: unresolved localities are picked up by the
// next one rather than turning one cron tick into an unbounded bill.
const MAX_LOOKUPS_PER_RUN = 40;

// locationKey lives in ingestion.ts: this module imports "server-only", which
// cannot be loaded under vitest, and that key format needs test coverage.

type CacheRow = { query: string; latitude: number | null; longitude: number | null; status: string };

function coordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readCache(supabase: SupabaseClient, keys: string[]) {
  const resolved = new Map<string, Coordinates>();
  const known = new Set<string>();
  if (keys.length === 0) return { resolved, known };

  const { data, error } = await supabase
    .from("geocode_cache")
    .select("query, latitude, longitude, status")
    .in("query", keys);
  // A cache read failure must not fail ingestion — it just means no coordinates
  // this run.
  if (error || !data) return { resolved, known };

  for (const row of data as CacheRow[]) {
    known.add(row.query);
    const latitude = coordinate(row.latitude);
    const longitude = coordinate(row.longitude);
    if (row.status === "resolved" && latitude !== null && longitude !== null) {
      resolved.set(row.query, { latitude, longitude });
    }
  }
  return { resolved, known };
}

type GeocodeResponse = {
  status?: string;
  results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
};

// Restricted to Australia on purpose: this is an Australian job board, and
// unrestricted lookups happily return a "Sydney" in Nova Scotia.
async function lookup(query: string, apiKey: string): Promise<Coordinates | null> {
  const params = new URLSearchParams({
    address: query,
    components: "country:AU",
    key: apiKey,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Geocoding request failed with status ${response.status}`);

  const payload = await response.json() as GeocodeResponse;
  if (payload.status === "ZERO_RESULTS") return null;
  if (payload.status !== "OK") throw new Error(`Geocoding returned status ${payload.status || "UNKNOWN"}`);

  const location = payload.results?.[0]?.geometry?.location;
  const latitude = coordinate(location?.lat);
  const longitude = coordinate(location?.lng);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

/**
 * Resolves locality keys to coordinates, consulting the cache first and only
 * calling Google for keys never seen before. Every outcome is written back,
 * misses included, so an unresolvable locality is paid for once.
 *
 * Without a Geocoding API key this still returns whatever the cache holds — the
 * seeded capitals — so the map is useful before the key is configured.
 */
export async function resolveLocations(
  supabase: SupabaseClient,
  keys: Iterable<string>,
): Promise<Map<string, Coordinates>> {
  const unique = [...new Set([...keys].filter(Boolean))];
  const { resolved, known } = await readCache(supabase, unique);

  const apiKey = getGeocodingApiKey();
  if (!apiKey) return resolved;

  const missing = unique.filter((key) => !known.has(key)).slice(0, MAX_LOOKUPS_PER_RUN);

  for (const key of missing) {
    try {
      const coordinates = await lookup(key, apiKey);
      await supabase.from("geocode_cache").upsert({
        query: key,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        status: coordinates ? "resolved" : "not_found",
        provider: "google",
        updated_at: new Date().toISOString(),
      }, { onConflict: "query" });
      if (coordinates) resolved.set(key, coordinates);
    } catch (error) {
      // Leave the key uncached so the next run retries it: a transient failure
      // should not be recorded as "this place does not exist".
      console.error("Geocoding failed", key, error);
    }
  }

  return resolved;
}
