import { NextResponse } from "next/server";
import { getAIProvider, type OpportunityForAI } from "@/utils/ai/provider";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { isAuthorizedBearer } from "@/lib/security";
import { runTrackedAI } from "@/lib/ai-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedBearer(request.headers.get("authorization"), getCronSecret())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("job_opportunities")
    .select("id, title, company_name, description_excerpt, skills, suburb, state, work_arrangement, employment_type")
    .eq("status", "active")
    .order("last_verified_at", { ascending: false })
    .limit(100);
  if (opportunitiesError) return NextResponse.json({ success: false, error: "Could not load opportunities" }, { status: 500 });
  if (!opportunities?.length) return NextResponse.json({ success: true, usersProcessed: 0, matchesCreated: 0 });

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1_000 });
  if (usersError) return NextResponse.json({ success: false, error: "Could not load users" }, { status: 500 });

  const provider = getAIProvider();
  let usersProcessed = 0;
  let matchesCreated = 0;
  let usersFailed = 0;

  for (const user of users.users) {
    try {
      const [{ data: profile }, { data: preferences }, { data: resume }, { count: todayCount }, { data: existingMatches }] = await Promise.all([
        supabase.from("profiles").select("first_name, job_stage, onboarding_status").eq("id", user.id).maybeSingle(),
        supabase.from("career_preferences").select("career_stage, primary_target_role, related_target_roles, preferred_suburb, preferred_state, search_radius_km, remote_preference, employment_types, industry_preferences").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("resumes").select("extracted_text").eq("user_id", user.id).eq("is_primary", true).maybeSingle(),
        supabase.from("user_opportunity_matches").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("batch_date", today),
        supabase.from("user_opportunity_matches").select("opportunity_id").eq("user_id", user.id).in("opportunity_id", opportunities.map((item) => item.id)),
      ]);

      if (profile?.onboarding_status !== "completed" || (todayCount || 0) >= 10) continue;
      const seen = new Set((existingMatches || []).map((item) => item.opportunity_id));
      const candidates = (opportunities as OpportunityForAI[]).filter((item) => !seen.has(item.id));
      if (!candidates.length) continue;

      const userProfile = {
        ...profile,
        ...preferences,
        resume_text: resume?.extracted_text?.slice(0, 60_000) || "",
      };
      const rankings = await runTrackedAI(
        supabase,
        user.id,
        "daily_match",
        JSON.stringify(userProfile).length + JSON.stringify(candidates).length,
        provider,
        () => provider.rankOpportunities(userProfile, candidates),
      );
      const remaining = Math.max(0, 10 - (todayCount || 0));
      const rows = rankings.slice(0, remaining).map((ranking, index) => ({
        user_id: user.id,
        opportunity_id: ranking.opportunity_id,
        batch_date: today,
        rank: (todayCount || 0) + index + 1,
        match_score: ranking.match_score,
        match_category: ranking.match_category,
        match_reasons: ranking.match_reasons,
        potential_gaps: ranking.potential_gaps,
        recommended_approach: ranking.recommended_approach,
        status: "new",
      }));
      if (rows.length) {
        const { error } = await supabase.from("user_opportunity_matches").insert(rows);
        if (error) throw error;
      }
      usersProcessed += 1;
      matchesCreated += rows.length;
    } catch {
      usersFailed += 1;
    }
  }

  return NextResponse.json({ success: usersFailed === 0, usersProcessed, matchesCreated, usersFailed });
}
