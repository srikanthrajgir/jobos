"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getAIProvider } from "@/utils/ai/provider";
import { requireUser } from "@/lib/auth";
import { runTrackedAI } from "@/lib/ai-run";
import { journeyPlanSchema, journeyRequestSchema } from "@/lib/validation";

export async function generateJobJourney(payload: unknown) {
  const parsed = journeyRequestSchema.parse(payload);
  const user = await requireUser();
  const supabase = await createClient();
  const provider = getAIProvider();
  const plan = await runTrackedAI(
    supabase,
    user.id,
    "job_journey",
    JSON.stringify(parsed).length,
    provider,
    () => provider.generateJourney(parsed),
  );
  return { success: true as const, plan };
}

export async function saveJobJourney(plan: unknown) {
  const parsed = journeyPlanSchema.parse(plan);
  const user = await requireUser();
  const supabase = await createClient();

  const { data: journey, error: journeyError } = await supabase.from("job_journeys").insert({
    user_id: user.id,
    title: parsed.journeyTitle,
    summary: parsed.summary,
    primary_outcome: parsed.milestones.at(-1)?.target_role,
    generated_by_ai: true,
  }).select("id").single();
  if (journeyError || !journey) throw new Error("Could not save the job journey");

  const { data: milestones, error: milestoneError } = await supabase.from("job_milestones").insert(
    parsed.milestones.map((milestone, index) => ({
      journey_id: journey.id,
      user_id: user.id,
      stage_key: milestone.stage_key,
      position: index + 1,
      title: milestone.title,
      target_role: milestone.target_role,
      description: milestone.description,
      target_date: milestone.target_date,
      status: index === 0 ? "in_progress" : "not_started",
    })),
  ).select("id, position");
  if (milestoneError || !milestones?.length) throw new Error("Could not save journey milestones");

  await supabase.from("job_journeys").update({ current_milestone_id: milestones[0].id }).eq("id", journey.id).eq("user_id", user.id);
  for (const milestone of milestones) {
    const source = parsed.milestones[milestone.position - 1];
    if (!source) continue;
    const writes: Array<PromiseLike<unknown>> = [];
    if (source.skills.length) {
      writes.push(supabase.from("job_milestone_skills").insert(source.skills.map((skill) => ({ milestone_id: milestone.id, skill_name: skill }))));
    }
    if (source.actions.length) {
      writes.push(supabase.from("job_milestone_actions").insert(source.actions.map((action) => ({ milestone_id: milestone.id, user_id: user.id, title: action.title, action_type: action.type }))));
    }
    await Promise.all(writes);
  }

  revalidatePath("/app");
  return { success: true as const, journeyId: journey.id as string };
}

export async function getActiveJourney() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_journeys")
    .select("id, title, summary, current_milestone_id, job_milestones(id, stage_key, position, title, target_role, description, target_date, status, job_milestone_skills(skill_name), job_milestone_actions(id, title, action_type, status))")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
