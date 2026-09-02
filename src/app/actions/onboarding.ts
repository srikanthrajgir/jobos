"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { extractResumeAction } from "@/app/actions/ai";
import { careerPreferencesSchema, resumeBuilderSchema } from "@/lib/validation";

// Next redacts thrown Server Action messages in production, so the client only
// ever sees an opaque digest. Onboarding steps therefore *return* their failure
// instead of throwing it — that is the only way a useful message reaches the
// user, and it keeps their typed input on screen for a retry.
export type StepResult = { ok: true } | { ok: false; message: string };

const RETRY_MESSAGE = "Please try again — nothing was lost.";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message || "Please check the details you entered.";
}

export async function getOnboardingState() {
  const user = await requireUser();
  const supabase = await createClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Upsert rather than insert: two tabs (or a double-submit) both see no row
    // and both write, and a plain insert makes the loser fail on the primary key.
    const { error: createError } = await supabase.from("profiles").upsert(
      { id: user.id, email: user.email, onboarding_status: "resume_required" },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (createError) throw new Error("Could not initialise onboarding");

    const { data: created } = await supabase
      .from("profiles")
      .select("onboarding_status")
      .eq("id", user.id)
      .maybeSingle();
    profile = created ?? { onboarding_status: "resume_required" };
  }

  // Prefill so a reload mid-flow does not make the user retype answers they
  // already confirmed.
  const { data: preferences } = await supabase
    .from("career_preferences")
    .select("career_stage, primary_target_role, preferred_suburb")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    onboarding_status: profile.onboarding_status || "resume_required",
    preferences: {
      career_stage: preferences?.career_stage || "",
      primary_target_role: preferences?.primary_target_role || "",
      preferred_suburb: preferences?.preferred_suburb || "",
    },
  };
}

export async function markUploadedResumeReady(resumeId: string): Promise<StepResult> {
  const parsed = z.string().uuid().safeParse(resumeId);
  if (!parsed.success) return { ok: false, message: "That résumé could not be identified." };

  const user = await requireUser();
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .eq("processing_status", "ready")
    .maybeSingle();
  if (!resume) return { ok: false, message: "That résumé is not ready yet. " + RETRY_MESSAGE };

  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  await supabase.from("resumes").update({ is_primary: true }).eq("id", parsed.data).eq("user_id", user.id);
  const { error } = await supabase.from("profiles").update({
    onboarding_status: "career_preferences_required",
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Your résumé was saved, but the next step could not be unlocked. " + RETRY_MESSAGE };

  revalidatePath("/app/onboarding");
  return { ok: true };
}

export async function submitResumeBuilder(formData: unknown): Promise<StepResult> {
  const parsed = resumeBuilderSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  const { error: resumeError } = await supabase.from("resumes").insert({
    user_id: user.id,
    display_name: `${parsed.data.name} resume`,
    source: "builder",
    parsed_data: { summary: parsed.data.summary },
    extracted_text: parsed.data.summary,
    processing_status: "ready",
    is_primary: true,
  });
  if (resumeError) return { ok: false, message: "Your résumé could not be saved. " + RETRY_MESSAGE };

  const { error } = await supabase.from("profiles").update({
    onboarding_status: "career_preferences_required",
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Your résumé was saved, but the next step could not be unlocked. " + RETRY_MESSAGE };

  revalidatePath("/app/onboarding");
  return { ok: true };
}

export async function submitCareerPreferences(preferences: unknown): Promise<StepResult> {
  const parsed = careerPreferencesSchema.safeParse(preferences);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

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
    ? supabase.from("career_preferences").update({ ...parsed.data, confirmed_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("career_preferences").insert({ user_id: user.id, ...parsed.data });
  const { error: preferenceError } = await write;
  if (preferenceError) return { ok: false, message: "Your preferences could not be saved. " + RETRY_MESSAGE };

  const { error } = await supabase.from("profiles").update({
    onboarding_status: "journey_decision_required",
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Your preferences were saved, but the next step could not be unlocked. " + RETRY_MESSAGE };

  revalidatePath("/app/onboarding");
  return { ok: true };
}

export async function completeOnboarding(journeyDecision: string): Promise<StepResult> {
  const parsed = z.enum(["yes", "no"]).safeParse(journeyDecision);
  if (!parsed.success) return { ok: false, message: "Please choose one of the two options." };

  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    onboarding_status: "completed",
    journey_decision: parsed.data,
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Onboarding could not be completed. " + RETRY_MESSAGE };

  // Revalidate but let the caller navigate. redirect() signals by throwing, and
  // a throw here would be indistinguishable from a real failure on the client.
  revalidatePath("/", "layout");
  return { ok: true };
}

// `extractResumeAction` is shared with ResumeManager, so its signature stays as
// it is. Onboarding wraps it here to convert the throw into a result and to
// classify the cause into something the user can act on — the raw message is
// never forwarded, since it can carry provider status codes.
const EXTRACTION_MESSAGES: ReadonlyArray<readonly [string, string]> = [
  ["not a valid PDF", 'That file is not a valid PDF. Export it again and retry.'],
  ["not a valid DOCX", 'That file is not a valid Word document. Export it again and retry.'],
  ["Resume files must be", 'Choose a file no larger than 5 MB.'],
  ["Invalid file encoding", 'That file could not be read. Try exporting it again.'],
  ["rate limit", 'That is several AI requests in a row. Wait a minute, then retry.'],
  ["usage controls", 'AI usage controls are unavailable right now. Please retry shortly.'],
  ["securely store", 'Your résumé could not be stored securely. Please retry.'],
  ["no text output", 'No text could be read from that file. Try a text-based PDF, or use Build a Résumé.'],
];

export async function extractOnboardingResume(input: {
  base64: string;
  mimeType: string;
  filename: string;
}): Promise<{ ok: true; resumeId: string } | { ok: false; message: string }> {
  try {
    const result = await extractResumeAction(input);
    return { ok: true, resumeId: result.resumeId };
  } catch (error) {
    console.error("Onboarding résumé extraction failed", error);
    const raw = error instanceof Error ? error.message : "";
    const match = EXTRACTION_MESSAGES.find(([needle]) => raw.includes(needle));
    return {
      ok: false,
      message: match
        ? match[1]
        : 'That résumé could not be processed. Please retry, or use Build a Résumé instead.',
    };
  }
}
