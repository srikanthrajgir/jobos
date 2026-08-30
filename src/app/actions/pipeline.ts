"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createApplication(jobId: string, customData?: { company: string, title: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const insertData: any = {
    user_id: user.id,
    stage: 'Discovered',
  };

  if (jobId) {
    insertData.job_id = jobId;
  } else if (customData) {
    insertData.custom_company_name = customData.company;
    insertData.custom_job_title = customData.title;
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([insertData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/app/pipeline');
  return data;
}

export async function updateApplicationStage(applicationId: string, newStage: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('applications')
    .update({ stage: newStage })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/app/pipeline');
  return data;
}

export async function getPipeline() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (title, location, companies(name))
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
