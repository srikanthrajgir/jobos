"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAIProvider } from "@/utils/ai/provider";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/auth";
import { runTrackedAI } from "@/lib/ai-run";
import {
  aiTextRequestSchema,
  applicationDocumentSchema,
  canonicalResumeSchema,
  decodeBase64,
  resumeUploadSchema,
  sanitizeFilename,
} from "@/lib/validation";

function verifyFileSignature(bytes: Buffer, mimeType: string) {
  const isPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (mimeType === "application/pdf" && !isPdf) throw new Error("The selected file is not a valid PDF");
  if (mimeType.includes("wordprocessingml") && !isZip) throw new Error("The selected file is not a valid DOCX document");
}

export async function extractResumeAction(input: {
  base64: string;
  mimeType: string;
  filename: string;
}) {
  const parsed = resumeUploadSchema.parse(input);
  const bytes = decodeBase64(parsed.base64);
  verifyFileSignature(bytes, parsed.mimeType);

  const user = await requireUser();
  const supabase = await createClient();
  const filename = sanitizeFilename(parsed.filename);
  const storagePath = `${user.id}/${randomUUID()}-${filename}`;

  const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, bytes, {
    contentType: parsed.mimeType,
    upsert: false,
  });
  if (uploadError) throw new Error("Could not securely store the resume");

  const { data: resume, error: insertError } = await supabase.from("resumes").insert({
    user_id: user.id,
    display_name: filename.replace(/\.[^.]+$/, ""),
    original_filename: filename,
    storage_path: storagePath,
    mime_type: parsed.mimeType,
    size_bytes: bytes.length,
    source: "uploaded",
    processing_status: "processing",
    is_primary: false,
  }).select("id").single();

  if (insertError || !resume) {
    await supabase.storage.from("resumes").remove([storagePath]);
    throw new Error("Could not create the resume record");
  }

  const provider = getAIProvider();
  try {
    const extractedText = await runTrackedAI(
      supabase,
      user.id,
      "extract_resume",
      parsed.base64.length,
      provider,
      () => provider.extractResumeText(parsed.base64, parsed.mimeType, filename),
    );

    const { error: updateError } = await supabase.from("resumes").update({
      processing_status: "ready",
      extracted_text: extractedText,
      parsed_data: { summary: extractedText },
      processing_error: null,
    }).eq("id", resume.id).eq("user_id", user.id);
    if (updateError) throw new Error("Could not save the extracted resume text");

    return { success: true as const, resumeId: resume.id as string, text: extractedText };
  } catch (error) {
    await supabase.from("resumes").update({
      processing_status: "failed",
      processing_error: "Resume extraction failed. The private source file was retained for retry.",
    }).eq("id", resume.id).eq("user_id", user.id);
    throw error;
  }
}

export async function saveCanonicalResumeAction(resumeId: string, text: string) {
  const input = canonicalResumeSchema.parse({ resumeId, text });
  const user = await requireUser();
  const supabase = await createClient();

  const { data: ownedResume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", input.resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ownedResume) throw new Error("Resume not found");

  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  const { error } = await supabase.from("resumes").update({
    is_primary: true,
    extracted_text: input.text,
    parsed_data: { summary: input.text },
    processing_status: "ready",
  }).eq("id", input.resumeId).eq("user_id", user.id);
  if (error) throw new Error("Could not save the canonical resume");

  revalidatePath("/app/resume");
  revalidatePath("/app/application-studio");
  return { success: true as const };
}

export async function generateFitGapAction(input: {
  jobTitle: string;
  companyName?: string;
  resumeText: string;
  jobDescription?: string;
}) {
  const parsed = aiTextRequestSchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const provider = getAIProvider();
  const analysis = await runTrackedAI(
    supabase,
    user.id,
    "fit_gap",
    parsed.resumeText.length + (parsed.jobDescription?.length || 0),
    provider,
    () => provider.generateText("fit_gap", parsed),
  );
  return { success: true as const, analysis };
}

export async function generateCoverLetterAction(input: {
  jobTitle: string;
  companyName?: string;
  resumeText: string;
  jobDescription?: string;
}) {
  const parsed = aiTextRequestSchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const provider = getAIProvider();
  const draft = await runTrackedAI(
    supabase,
    user.id,
    "cover_letter",
    parsed.resumeText.length + (parsed.jobDescription?.length || 0),
    provider,
    () => provider.generateText("cover_letter", parsed),
  );
  return { success: true as const, draft };
}

export async function saveApplicationDocument(input: {
  opportunityId?: string;
  documentType: "cover_letter" | "resume_variant";
  title: string;
  content: string;
}) {
  const parsed = applicationDocumentSchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("application_documents").insert({
    user_id: user.id,
    opportunity_id: parsed.opportunityId || null,
    document_type: parsed.documentType,
    title: parsed.title,
    content: parsed.content,
  }).select("id").single();
  if (error || !data) throw new Error("Could not save the application document");
  revalidatePath("/app/application-studio");
  return { success: true as const, id: data.id as string };
}
