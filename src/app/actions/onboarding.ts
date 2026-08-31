"use server";

import { createClient } from '@/utils/supabase/server';
import { getAIProvider } from '@/utils/ai/provider';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getOnboardingState() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  if (!profile) {
    // Ensure profile exists
    const { data: newProfile } = await supabase.from('profiles').insert([{ id: user.id, onboarding_status: 'resume_required' }]).select().single();
    profile = newProfile;
  }
  return profile;
}

export async function submitResumeBuilder(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Save built resume
  const { data: resume } = await supabase.from('resumes').insert([{
    user_id: user.id,
    display_name: 'JobOS Built Resume',
    source: 'builder',
    parsed_data: formData,
    processing_status: 'ready'
  }]).select().single();

  await supabase.from('profiles').update({ onboarding_status: 'career_preferences_required' }).eq('id', user.id);
  revalidatePath('/app/onboarding');
  return { success: true };
}

export async function parseUploadedResume(resumeId: string) {
  // In a real app, this would read the file from storage and pass to AI
  const provider = getAIProvider();
  const text = await provider.extractResumeText("dummy_base64", "application/pdf");
  
  const supabase = await createClient();
  await supabase.from('resumes').update({
    processing_status: 'ready',
    parsed_data: { summary: text, experienceYears: 2, suggestedCareerLevel: 'early_career' }
  }).eq('id', resumeId);

  await supabase.from('profiles').update({ onboarding_status: 'career_preferences_required' }).eq('id', (await supabase.auth.getUser()).data.user!.id);
  revalidatePath('/app/onboarding');
}

export async function submitCareerPreferences(preferences: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from('career_preferences').insert([{
    user_id: user.id,
    ...preferences
  }]);

  await supabase.from('profiles').update({ onboarding_status: 'journey_decision_required' }).eq('id', user.id);
  revalidatePath('/app/onboarding');
}

export async function completeOnboarding(journeyDecision: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from('profiles').update({ 
    onboarding_status: 'completed',
    journey_decision: journeyDecision,
    onboarding_completed_at: new Date().toISOString()
  }).eq('id', user.id);

  redirect('/app');
}
