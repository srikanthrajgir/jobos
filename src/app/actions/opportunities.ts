"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getAIProvider, type OpportunityForAI } from "@/utils/ai/provider";
import { requireUser } from "@/lib/auth";
import { runTrackedAI } from "@/lib/ai-run";
import { sendApplicationEmail } from "@/lib/email/resend";
import { applicationDraftSchema, emailSchema, opportunityStatusSchema, uuidSchema } from "@/lib/validation";

export type OpportunityMatch = {
  id: string;
  opportunity_id: string;
  status: "new" | "saved" | "dismissed" | "applied";
  batch_date: string;
  match_score: number | null;
  match_category: string | null;
  match_reasons: string[];
  potential_gaps: string[];
  recommended_approach: string | null;
  job_opportunities: {
    id: string;
    title: string;
    company_name: string | null;
    description_excerpt: string | null;
    employment_type: string | null;
    work_arrangement: string | null;
    suburb: string | null;
    state: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    published_at: string | null;
    application_mode: string | null;
    application_email: string | null;
    application_url: string | null;
  } | null;
};

export async function getUserMatches(): Promise<OpportunityMatch[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_opportunity_matches")
    .select(`
      id, opportunity_id, status, batch_date, match_score, match_category,
      match_reasons, potential_gaps, recommended_approach,
      job_opportunities (
        id, title, company_name, description_excerpt, employment_type,
        work_arrangement, suburb, state, salary_min, salary_max,
        salary_currency, published_at, application_mode, application_email,
        application_url
      )
    `)
    .eq("user_id", user.id)
    .order("batch_date", { ascending: false })
    .order("rank", { ascending: true });
  if (error) throw new Error("Could not load opportunities");
  return (data || []) as unknown as OpportunityMatch[];
}

export async function updateMatchStatus(matchId: string, status: "new" | "saved" | "dismissed", reason?: string) {
  const id = uuidSchema.parse(matchId);
  const parsedStatus = opportunityStatusSchema.exclude(["applied"]).parse(status);
  const dismissalReason = z.string().trim().max(500).optional().parse(reason);
  const user = await requireUser();
  const supabase = await createClient();

  const now = new Date().toISOString();
  const updates = {
    status: parsedStatus,
    saved_at: parsedStatus === "saved" ? now : null,
    dismissed_at: parsedStatus === "dismissed" ? now : null,
    dismissal_reason: parsedStatus === "dismissed" ? dismissalReason || null : null,
  };
  const { data, error } = await supabase
    .from("user_opportunity_matches")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Opportunity match not found");
  revalidatePath("/app/opportunities");
  return { success: true as const };
}

async function getOwnedOpportunity(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, opportunityId: string) {
  const { data: match } = await supabase
    .from("user_opportunity_matches")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (!match) throw new Error("Opportunity is not assigned to this account");

  const { data: opportunity } = await supabase
    .from("job_opportunities")
    .select("id, title, company_name, description_excerpt, skills, suburb, state, work_arrangement, employment_type, application_mode, application_email, application_url")
    .eq("id", opportunityId)
    .eq("status", "active")
    .maybeSingle();
  if (!opportunity) throw new Error("Opportunity is no longer available");
  return opportunity;
}

export async function getApplicationDraft(opportunityId: string) {
  const id = uuidSchema.parse(opportunityId);
  const user = await requireUser();
  const supabase = await createClient();
  const opportunity = await getOwnedOpportunity(supabase, user.id, id);
  if (opportunity.application_mode !== "email" || !opportunity.application_email) {
    throw new Error("This employer accepts applications on its own website");
  }

  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from("profiles").select("first_name, full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("resumes").select("id, extracted_text").eq("user_id", user.id).eq("is_primary", true).maybeSingle(),
  ]);
  if (!resume?.extracted_text) throw new Error("Save a canonical resume before applying");

  const provider = getAIProvider();
  const draft = await runTrackedAI(
    supabase,
    user.id,
    "application_email",
    resume.extracted_text.length + (opportunity.description_excerpt?.length || 0),
    provider,
    () => provider.draftApplicationEmail(
      { ...profile, email: user.email, resume_text: resume.extracted_text, resume_available: true },
      opportunity as OpportunityForAI,
    ),
  );
  return { ...draft, recipient: opportunity.application_email };
}

export async function confirmApplication(input: {
  opportunityId: string;
  subject: string;
  body: string;
  authorized: true;
  idempotencyKey: string;
}) {
  const parsed = applicationDraftSchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const opportunity = await getOwnedOpportunity(supabase, user.id, parsed.opportunityId);
  if (opportunity.application_mode !== "email") throw new Error("This opportunity requires an external application");
  const recipient = emailSchema.parse(opportunity.application_email);

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, storage_path, original_filename, mime_type")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();
  if (!resume?.storage_path) throw new Error("A securely uploaded canonical resume is required to apply");

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id, delivery_status")
    .eq("user_id", user.id)
    .eq("idempotency_key", parsed.idempotencyKey)
    .maybeSingle();
  if (existing?.delivery_status === "delivered") return { success: true as const, applicationId: existing.id as string };

  const followUp = new Date();
  followUp.setUTCDate(followUp.getUTCDate() + 5);
  let applicationId = existing?.id as string | undefined;
  if (!applicationId) {
    const { data: application, error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      opportunity_id: parsed.opportunityId,
      company_name: opportunity.company_name || "Unknown company",
      role_title: opportunity.title,
      status: "draft",
      delivery_status: "pending",
      submission_method: "email",
      recipient_email: recipient,
      subject: parsed.subject,
      message_body: parsed.body,
      resume_id: resume.id,
      idempotency_key: parsed.idempotencyKey,
      next_follow_up_at: followUp.toISOString(),
    }).select("id").single();
    if (error || !application) throw new Error("Could not create the application record");
    applicationId = application.id;
  } else {
    await supabase.from("job_applications").update({ delivery_status: "pending", failed_at: null, failure_reason: null }).eq("id", applicationId).eq("user_id", user.id);
  }

  let providerId: string;
  try {
    const { data: resumeFile, error: downloadError } = await supabase.storage.from("resumes").download(resume.storage_path);
    if (downloadError || !resumeFile) throw new Error("Could not retrieve the canonical resume");
    if (resumeFile.size > 5 * 1024 * 1024) throw new Error("The canonical resume is too large to attach");
    const attachment = Buffer.from(await resumeFile.arrayBuffer()).toString("base64");
    providerId = await sendApplicationEmail({
      to: recipient,
      subject: parsed.subject,
      text: parsed.body,
      replyTo: user.email || undefined,
      idempotencyKey: parsed.idempotencyKey,
      attachments: [{ filename: resume.original_filename || "resume.pdf", content: attachment }],
    });

  } catch (error) {
    await supabase.from("job_applications").update({
      delivery_status: "failed",
      failed_at: new Date().toISOString(),
      failure_reason: "Email delivery failed. Safe to retry with the same application request.",
    }).eq("id", applicationId).eq("user_id", user.id);
    throw error;
  }

  const deliveredAt = new Date().toISOString();
  const deliveredState = {
    status: "applied",
    delivery_status: "delivered",
    email_delivery_id: providerId,
    delivered_at: deliveredAt,
    applied_at: deliveredAt,
    failed_at: null,
    failure_reason: null,
  };
  const { error: deliveryUpdateError } = await supabase
    .from("job_applications")
    .update(deliveredState)
    .eq("id", applicationId)
    .eq("user_id", user.id);
  if (deliveryUpdateError) {
    const { error: retryError } = await supabase
      .from("job_applications")
      .update(deliveredState)
      .eq("id", applicationId)
      .eq("user_id", user.id);
    if (retryError) throw new Error("The application was sent, but its pipeline record needs support. Do not send it again.");
  }

  await Promise.allSettled([
    supabase.from("user_opportunity_matches").update({ status: "applied" }).eq("opportunity_id", parsed.opportunityId).eq("user_id", user.id),
    supabase.from("application_delivery_events").insert({
      application_id: applicationId,
      provider: "resend",
      provider_message_id: providerId,
      event_type: "sent",
      event_timestamp: deliveredAt,
    }),
    supabase.from("user_tasks").upsert({
      user_id: user.id,
      application_id: applicationId,
      title: `Follow up application for ${opportunity.title}`,
      due_date: followUp.toISOString().slice(0, 10),
    }, { onConflict: "user_id,application_id" }),
  ]);

  revalidatePath("/app");
  revalidatePath("/app/opportunities");
  revalidatePath("/app/pipeline");
  return { success: true as const, applicationId };
}
