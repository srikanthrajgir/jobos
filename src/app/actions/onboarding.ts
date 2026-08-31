"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { careerPreferencesSchema, resumeBuilderSchema } from "@/lib/validation";

export async function getOnboardingState() {
  const user = await requireUser();
  const supabase = await createClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data, error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      onboarding_status: "resume_required",
    }).select("onboarding_status").single();
    if (error || !data) throw new Error("Could not initialise onboarding");
    profile = data;
  }
  return { onboarding_status: profile.onboarding_status || "resume_required" };
}

export async function markUploadedResumeReady(resumeId: string) {
  const id = z.string().uuid().parse(resumeId);
  const user = await requireUser();
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("processing_status", "ready")
    .maybeSingle();
  if (!resume) throw new Error("Processed resume not found");

  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  await supabase.from("resumes").update({ is_primary: true }).eq("id", id).eq("user_id", user.id);
  const { error } = await supabase.from("profiles").update({
    onboarding_status: "career_preferences_required",
  }).eq("id", user.id);
  if (error) throw new Error("Could not advance onboarding");
  revalidatePath("/app/onboarding");
  return { success: true as const };
}

export async function submitResumeBuilder(formData: unknown) {
  const parsed = resumeBuilderSchema.parse(formData);
  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  const { error: resumeError } = await supabase.from("resumes").insert({
    user_id: user.id,
    display_name: `${parsed.name} resume`,
    source: "builder",
    parsed_data: { summary: parsed.summary },
    extracted_text: parsed.summary,
    processing_status: "ready",
    is_primary: true,
  });
  if (resumeError) throw new Error("Could not save the resume");

  const { error } = await supabase.from("profiles").update({
    onboarding_status: "career_preferences_required",
  }).eq("id", user.id);
  if (error) throw new Error("Could not advance onboarding");
  revalidatePath("/app/onboarding");
  return { success: true as const };
}

export async function submitCareerPreferences(preferences: unknown) {
  const parsed = careerPreferencesSchema.parse(preferences);
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("career_preferences")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const write = existing
    ? supabase.from("career_preferences").update({ ...parsed, confirmed_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("career_preferences").insert({ user_id: user.id, ...parsed });
  const { error: preferenceError } = await write;
  if (preferenceError) throw new Error("Could not save career preferences");

  const { error } = await supabase.from("profiles").update({
    onboarding_status: "journey_decision_required",
  }).eq("id", user.id);
  if (error) throw new Error("Could not advance onboarding");
  revalidatePath("/app/onboarding");
  return { success: true as const };
}

export async function completeOnboarding(journeyDecision: string) {
  const decision = z.enum(["yes", "no"]).parse(journeyDecision);
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    onboarding_status: "completed",
    journey_decision: decision,
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) throw new Error("Could not complete onboarding");
  redirect("/app");
}
