"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const industry = formData.get('industry') as string;
  
  const { data, error } = await supabase
    .from('companies')
    .insert([{ name, industry }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/companies');
  return data;
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const company_id = formData.get('company_id') as string;
  const title = formData.get('title') as string;
  const location = formData.get('location') as string;
  
  const { data, error } = await supabase
    .from('jobs')
    .insert([{ company_id, title, location }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/jobs');
  return data;
}

export async function getOpportunities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (name, industry)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(error.message);
  return data;
}
