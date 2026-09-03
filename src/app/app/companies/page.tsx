import CompaniesDirectory, { type CompanyDirectoryItem } from "@/components/CompaniesDirectory";
import { createClient } from "@/utils/supabase/server";
import { getGoogleMapsApiKey } from "@/lib/env";

// DECIMAL columns come back from PostgREST as strings, so coerce and reject
// anything that is not a usable coordinate rather than passing NaN to the map.
function coordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_opportunities")
    .select("id, company_name, industry, suburb, state, title, canonical_url, latitude, longitude")
    .eq("status", "active")
    .not("company_name", "is", null)
    .order("last_verified_at", { ascending: false })
    .limit(500);

  const grouped = new Map<string, CompanyDirectoryItem>();
  for (const job of data || []) {
    const name = job.company_name?.trim();
    if (!name) continue;
    const existing: CompanyDirectoryItem = grouped.get(name) || {
      name,
      industry: job.industry || "Industry not listed",
      location: [job.suburb, job.state].filter(Boolean).join(", ") || "Location varies",
      website: job.canonical_url || null,
      lat: null,
      lng: null,
      roles: [],
    };
    // Take the first usable coordinate pair seen for a company; rows are already
    // ordered by last_verified_at, so that is the freshest one.
    if (existing.lat === null || existing.lng === null) {
      const lat = coordinate(job.latitude);
      const lng = coordinate(job.longitude);
      if (lat !== null && lng !== null) {
        existing.lat = lat;
        existing.lng = lng;
      }
    }
    if (existing.roles.length < 8) existing.roles.push({ id: job.id, title: job.title, url: job.canonical_url || null });
    grouped.set(name, existing);
  }

  return (
    <CompaniesDirectory
      companies={[...grouped.values()].sort((a, b) => a.name.localeCompare(b.name))}
      mapsApiKey={getGoogleMapsApiKey()}
    />
  );
}
