"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { manualApplicationSchema, pipelineStageSchema, uuidSchema } from "@/lib/validation";

export type PipelineApplication = {
  id: string;
  roleTitle: string;
  companyName: string;
  status: string;
  appliedAt: string | null;
  followUpAt: string | null;
  notes: string;
  deliveryStatus: string;
  updatedAt: string;
};

export async function createApplication(input: { company: string; title: string; notes?: string }) {
  const parsed = manualApplicationSchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("job_applications").insert({
    user_id: user.id,
    company_name: parsed.company,
    role_title: parsed.title,
    status: "saved",
    delivery_status: "not_required",
    submission_method: "manual",
    notes: parsed.notes || null,
  }).select("id").single();
  if (error || !data) throw new Error("Could not add the application");
  revalidatePath("/app/pipeline");
  revalidatePath("/app");
  return { success: true as const, id: data.id as string };
}

export async function updateApplicationStage(applicationId: string, newStage: string) {
  const id = uuidSchema.parse(applicationId);
  const stage = pipelineStageSchema.parse(newStage);
  const user = await requireUser();
  const supabase = await createClient();
  const updates: { status: string; applied_at?: string } = { status: stage };
  if (stage === "applied") updates.applied_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("job_applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Application not found or could not be moved");
  revalidatePath("/app/pipeline");
  revalidatePath("/app");
  return { success: true as const };
}

export async function getPipeline(): Promise<PipelineApplication[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select("id, role_title, company_name, status, applied_at, next_follow_up_at, notes, delivery_status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load the application pipeline");
  return (data || []).map((item) => ({
    id: item.id,
    roleTitle: item.role_title,
    companyName: item.company_name,
    status: item.status,
    appliedAt: item.applied_at,
    followUpAt: item.next_follow_up_at,
    notes: item.notes || "",
    deliveryStatus: item.delivery_status || "not_required",
    updatedAt: item.updated_at,
  }));
}
