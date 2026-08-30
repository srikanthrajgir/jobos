"use server";

import { getAIProvider } from '@/utils/ai/provider';
import { createClient } from '@/utils/supabase/server';

export async function extractResumeAction(fileBase64: string, mimeType: string) {
  const provider = getAIProvider();
  
  // Here we would also log the AI run to `ai_runs` table for auditability and quotas.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const extractedText = await provider.extractResumeText(fileBase64, mimeType);
  
  return { success: true, text: extractedText };
}

export async function generateFitGapAction(jobTitle: string, resumeText: string) {
  const provider = getAIProvider();
  
  const analysis = await provider.generateText('fit_gap', { jobTitle, resumeText });
  
  return { success: true, analysis };
}

export async function generateCoverLetterAction(jobTitle: string, companyName: string, resumeText: string) {
  const provider = getAIProvider();
  
  const draft = await provider.generateText('cover_letter', { jobTitle, companyName, resumeText });
  
  return { success: true, draft };
}
