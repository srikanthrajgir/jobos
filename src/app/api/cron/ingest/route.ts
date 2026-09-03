import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { isAuthorizedBearer } from "@/lib/security";
import { fetchSourceOpportunities, locationKey, type JobSource } from "@/lib/ingestion";
import { resolveLocations } from "@/lib/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedBearer(request.headers.get("authorization"), getCronSecret())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: sources, error } = await supabase
    .from("job_sources")
    .select("id, name, source_type, base_url")
    .eq("enabled", true)
    .eq("permission_status", "approved")
    .in("source_type", ["greenhouse", "lever"]);
  if (error) return NextResponse.json({ success: false, error: "Could not load approved job sources" }, { status: 500 });

  let sourcesProcessed = 0;
  let opportunitiesUpserted = 0;
  let geocoded = 0;
  const failures: Array<{ sourceId: string; error: string }> = [];

  for (const source of (sources || []) as JobSource[]) {
    try {
      const jobs = await fetchSourceOpportunities(source);
      if (jobs.length) {
        // Geocode by locality before the upsert, so coordinates are written in
        // the same statement rather than needing a second pass. Distinct
        // suburbs are far fewer than postings, which is what keeps this cheap.
        const keys = new Set<string>();
        for (const job of jobs) {
          const key = locationKey(job.suburb, job.state);
          if (key) keys.add(key);
        }
        const coordinates = await resolveLocations(supabase, keys);
        for (const job of jobs) {
          const key = locationKey(job.suburb, job.state);
          const point = key ? coordinates.get(key) : undefined;
          if (point) {
            job.latitude = point.latitude;
            job.longitude = point.longitude;
          }
        }
        geocoded += jobs.filter((job) => job.latitude !== null).length;

        const { error: upsertError } = await supabase
          .from("job_opportunities")
          .upsert(jobs, { onConflict: "job_source_id,external_job_id" });
        if (upsertError) throw upsertError;
      }
      const finishedAt = new Date().toISOString();
      await supabase.from("job_sources").update({
        last_checked_at: finishedAt,
        last_ingested_at: finishedAt,
        last_error: null,
      }).eq("id", source.id);
      sourcesProcessed += 1;
      opportunitiesUpserted += jobs.length;
    } catch (sourceError) {
      const message = sourceError instanceof Error ? sourceError.message.slice(0, 500) : "Unknown ingestion error";
      failures.push({ sourceId: source.id, error: message });
      await supabase.from("job_sources").update({
        last_checked_at: new Date().toISOString(),
        last_error: message,
      }).eq("id", source.id);
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    sourcesProcessed,
    opportunitiesUpserted,
    geocoded,
    failures,
  }, { status: failures.length && sourcesProcessed === 0 ? 502 : 200 });
}
