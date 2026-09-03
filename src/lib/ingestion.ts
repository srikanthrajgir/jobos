import { createHash } from "node:crypto";

export type JobSource = {
  id: string;
  name: string;
  source_type: "greenhouse" | "lever";
  base_url: string;
};

export type NormalizedOpportunity = {
  job_source_id: string;
  external_job_id: string;
  company_name: string;
  canonical_url: string;
  title: string;
  department: string | null;
  description_excerpt: string;
  employment_type: string | null;
  work_arrangement: string | null;
  suburb: string | null;
  state: string | null;
  // Filled in after normalisation by the geocoder, keyed on suburb/state, so
  // the coordinates land in the same upsert as the rest of the posting.
  latitude: number | null;
  longitude: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  published_at: string | null;
  application_url: string;
  application_mode: "url";
  content_hash: string;
  status: "active";
  last_verified_at: string;
};

type GreenhouseJob = {
  id: number | string;
  // The Job Board API calls this `title`. This said `name` — a field Greenhouse
  // never sends — so every posting failed the required-field check below and no
  // Greenhouse source could ingest anything, ever. Verified against the live
  // board: 597 of 597 postings carry `title`, none carry `name`.
  title: string;
  absolute_url: string;
  content?: string;
  updated_at?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
};

type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: {
    location?: string;
    commitment?: string;
    department?: string;
  };
  salaryRange?: { min?: number; max?: number; currency?: string };
};

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&nbsp;": " ",
  };
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => entities[match] || match);
}

export function plainTextFromHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assertAllowedSourceUrl(raw: string, sourceType: JobSource["source_type"]): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Job source must use an unauthenticated HTTPS URL");

  if (sourceType === "greenhouse") {
    if (url.hostname !== "boards-api.greenhouse.io" || !/^\/v1\/boards\/[^/]+\/jobs$/.test(url.pathname)) {
      throw new Error("Greenhouse source URL is not an approved Job Board endpoint");
    }
    url.searchParams.set("content", "true");
  } else if (!["api.lever.co", "api.eu.lever.co"].includes(url.hostname) || !/^\/v0\/postings\/[^/]+$/.test(url.pathname)) {
    throw new Error("Lever source URL is not an approved Postings API endpoint");
  } else {
    url.searchParams.set("mode", "json");
  }

  return url;
}

function locationParts(location?: string): { suburb: string | null; state: string | null } {
  if (!location) return { suburb: null, state: null };
  const state = location.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i)?.[1]?.toUpperCase() || null;
  const suburb = location.split(",")[0]?.trim().slice(0, 120) || null;
  return { suburb, state };
}

/**
 * Cache key for a posting's locality. Must match the values seeded in
 * supabase/migrations/00000000000005_geocode_cache.sql.
 *
 * The state is omitted when a location string does not name one — Greenhouse
 * commonly reports "Sydney, Australia", which locationParts() reduces to suburb
 * "Sydney" with a null state, so both "sydney" and "sydney, nsw" are seeded.
 */
export function locationKey(suburb: string | null, state: string | null): string | null {
  const cleaned = suburb?.trim().toLowerCase().replace(/\s+/g, " ") || "";
  if (!cleaned) return null;
  const stateCode = state?.trim().toLowerCase() || "";
  return stateCode ? `${cleaned}, ${stateCode}` : cleaned;
}

function contentHash(value: object): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function normalizeGreenhouse(source: JobSource, payload: unknown, verifiedAt = new Date().toISOString()): NormalizedOpportunity[] {
  const jobs = (payload as { jobs?: GreenhouseJob[] })?.jobs;
  if (!Array.isArray(jobs)) throw new Error("Greenhouse returned an invalid jobs payload");

  return jobs.slice(0, 1_000).map((job) => {
    if (!job.id || !job.title || !job.absolute_url) throw new Error("Greenhouse job is missing required fields");
    const description = plainTextFromHtml(job.content || "").slice(0, 20_000);
    const location = locationParts(job.location?.name);
    return {
      job_source_id: source.id,
      external_job_id: String(job.id),
      company_name: source.name.slice(0, 160),
      canonical_url: new URL(job.absolute_url).toString(),
      title: job.title.trim().slice(0, 200),
      department: job.departments?.[0]?.name?.trim().slice(0, 160) || null,
      description_excerpt: description,
      employment_type: null,
      work_arrangement: null,
      ...location,
      latitude: null,
      longitude: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      published_at: job.updated_at ? new Date(job.updated_at).toISOString() : null,
      application_url: new URL(job.absolute_url).toString(),
      application_mode: "url",
      content_hash: contentHash(job),
      status: "active",
      last_verified_at: verifiedAt,
    };
  });
}

export function normalizeLever(source: JobSource, payload: unknown, verifiedAt = new Date().toISOString()): NormalizedOpportunity[] {
  if (!Array.isArray(payload)) throw new Error("Lever returned an invalid postings payload");

  return (payload as LeverJob[]).slice(0, 1_000).map((job) => {
    if (!job.id || !job.text || !job.hostedUrl || !job.applyUrl) throw new Error("Lever posting is missing required fields");
    const location = locationParts(job.categories?.location);
    return {
      job_source_id: source.id,
      external_job_id: job.id,
      company_name: source.name.slice(0, 160),
      canonical_url: new URL(job.hostedUrl).toString(),
      title: job.text.trim().slice(0, 200),
      department: job.categories?.department?.trim().slice(0, 160) || null,
      description_excerpt: `${job.descriptionPlain || ""}\n${job.additionalPlain || ""}`.trim().slice(0, 20_000),
      employment_type: job.categories?.commitment?.trim().slice(0, 120) || null,
      work_arrangement: job.workplaceType?.trim().slice(0, 80) || null,
      ...location,
      latitude: null,
      longitude: null,
      salary_min: Number.isFinite(job.salaryRange?.min) ? Number(job.salaryRange?.min) : null,
      salary_max: Number.isFinite(job.salaryRange?.max) ? Number(job.salaryRange?.max) : null,
      salary_currency: job.salaryRange?.currency?.trim().slice(0, 8) || null,
      published_at: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      application_url: new URL(job.applyUrl).toString(),
      application_mode: "url",
      content_hash: contentHash(job),
      status: "active",
      last_verified_at: verifiedAt,
    };
  });
}

export async function fetchSourceOpportunities(source: JobSource): Promise<NormalizedOpportunity[]> {
  const url = assertAllowedSourceUrl(source.base_url, source.source_type);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "JobOS/1.0 job-ingestion" },
    signal: AbortSignal.timeout(20_000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Job source returned status ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 5_000_000) throw new Error("Job source response is too large");
  const text = await response.text();
  if (text.length > 5_000_000) throw new Error("Job source response is too large");
  const payload = JSON.parse(text) as unknown;
  return source.source_type === "greenhouse"
    ? normalizeGreenhouse(source, payload)
    : normalizeLever(source, payload);
}
