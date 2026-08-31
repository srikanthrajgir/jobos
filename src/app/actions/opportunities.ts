"use server";

import { createClient } from '@/utils/supabase/server';
import { getAIProvider } from '@/utils/ai/provider';
import { revalidatePath } from 'next/cache';

export async function getUserMatches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch matches joining with job_opportunities
  const { data: matches, error } = await supabase
    .from('user_opportunity_matches')
    .select(`
      *,
      job_opportunities (*)
    `)
    .eq('user_id', user.id)
    .order('rank', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return matches || [];
}

export async function updateMatchStatus(matchId: string, status: 'saved' | 'dismissed' | 'applied', reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updates: any = { status };
  if (status === 'saved') updates.saved_at = new Date().toISOString();
  if (status === 'dismissed') {
    updates.dismissed_at = new Date().toISOString();
    if (reason) updates.dismissal_reason = reason;
  }

  const { error } = await supabase
    .from('user_opportunity_matches')
    .update(updates)
    .eq('id', matchId)
    .eq('user_id', user.id);

  if (error) throw error;
  
  if (status === 'saved') {
    // Add momentum for saving
    // Minimal mock for momentum addition since user_activity_events isn't strictly defined yet
  }
  
  revalidatePath('/app/opportunities');
  return { success: true };
}

export async function getApplicationDraft(opportunityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: opp } = await supabase.from('job_opportunities').select('*').eq('id', opportunityId).single();
  
  const provider = getAIProvider();
  const draft = await provider.draftApplicationEmail(profile, opp);

  return draft;
}

export async function confirmApplication(opportunityId: string, method: string, emailData?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: opp } = await supabase.from('job_opportunities').select('*').eq('id', opportunityId).single();

  // 1. Create Application
  const { data: app, error } = await supabase.from('job_applications').insert([{
    user_id: user.id,
    opportunity_id: opportunityId,
    company_name: 'Unknown Company', // In a real app we'd resolve company_id and name properly
    role_title: opp.title,
    status: 'applied',
    submission_method: method,
    recipient_email: emailData?.recipient,
    subject: emailData?.subject,
    message_body: emailData?.body
  }]).select().single();

  if (error) throw error;

  // 2. Update Match Status
  await supabase
    .from('user_opportunity_matches')
    .update({ status: 'applied' })
    .eq('opportunity_id', opportunityId)
    .eq('user_id', user.id);

  // 3. Create Follow-up Task
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 5);
  
  await supabase.from('user_tasks').insert([{
    user_id: user.id,
    title: `Follow up application for ${opp.title}`,
    due_date: followUpDate.toISOString().split('T')[0]
  }]);

  revalidatePath('/app');
  revalidatePath('/app/opportunities');
  
  return { success: true };
}
