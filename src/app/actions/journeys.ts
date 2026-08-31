"use server";

import { createClient } from '@/utils/supabase/server';
import { getAIProvider } from '@/utils/ai/provider';
import { revalidatePath } from 'next/cache';

export async function generateJobJourney(payload: any) {
  const provider = getAIProvider();
  const journeyPlan = await provider.generateJourney(payload);
  return { success: true, plan: journeyPlan };
}

export async function saveJobJourney(plan: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Insert Journey
  const { data: journey, error: journeyError } = await supabase
    .from('job_journeys')
    .insert([{
      user_id: user.id,
      title: plan.journeyTitle,
      summary: plan.summary,
      primary_outcome: plan.milestones[plan.milestones.length - 1]?.target_role,
      generated_by_ai: true
    }])
    .select()
    .single();

  if (journeyError) throw new Error(journeyError.message);

  // 2. Insert Milestones
  const milestonesToInsert = plan.milestones.map((m: any, idx: number) => ({
    journey_id: journey.id,
    user_id: user.id,
    stage_key: m.stage_key,
    position: idx + 1,
    title: m.title,
    target_role: m.target_role,
    description: m.description,
    target_date: m.target_date,
    status: idx === 0 ? 'in_progress' : 'not_started'
  }));

  const { data: insertedMilestones, error: milestoneError } = await supabase
    .from('job_milestones')
    .insert(milestonesToInsert)
    .select();

  if (milestoneError) throw new Error(milestoneError.message);

  // Set the first milestone as the current one
  if (insertedMilestones && insertedMilestones.length > 0) {
    const firstMilestone = insertedMilestones.find(m => m.position === 1);
    if (firstMilestone) {
      await supabase.from('job_journeys').update({ current_milestone_id: firstMilestone.id }).eq('id', journey.id);
    }

    // Insert actions and skills for each milestone
    for (const im of insertedMilestones) {
      const pm = plan.milestones.find((m:any) => m.position === im.position || m.title === im.title);
      if (pm) {
        if (pm.skills && pm.skills.length > 0) {
          const skillsToInsert = pm.skills.map((s: string) => ({
            milestone_id: im.id,
            skill_name: s
          }));
          await supabase.from('job_milestone_skills').insert(skillsToInsert);
        }
        if (pm.actions && pm.actions.length > 0) {
          const actionsToInsert = pm.actions.map((a: any) => ({
            milestone_id: im.id,
            user_id: user.id,
            title: a.title,
            action_type: a.type
          }));
          await supabase.from('job_milestone_actions').insert(actionsToInsert);
        }
      }
    }
  }

  revalidatePath('/app');
  return { success: true, journeyId: journey.id };
}

export async function getActiveJourney() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: journey } = await supabase
    .from('job_journeys')
    .select('*, job_milestones(*, job_milestone_skills(*), job_milestone_actions(*))')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return journey;
}
