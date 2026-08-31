import { z } from "zod";

const shortText = (max: number) => z.string().trim().min(1).max(max);

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().trim().email().max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
});

export const careerPreferencesSchema = z.object({
  career_stage: z.enum(["early", "experienced", "promotion", "career_change"]),
  primary_target_role: shortText(120),
  preferred_suburb: z.string().trim().max(120).default(""),
  preferred_state: z.string().trim().max(80).optional(),
  search_radius_km: z.number().int().min(1).max(250).optional(),
});

export const resumeBuilderSchema = z.object({
  name: shortText(120),
  summary: shortText(10_000),
});

export const resumeUploadSchema = z.object({
  filename: shortText(180),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  base64: z.string().min(16).max(7_100_000),
});

export const canonicalResumeSchema = z.object({
  resumeId: uuidSchema,
  text: shortText(100_000),
});

export const aiTextRequestSchema = z.object({
  jobTitle: shortText(160),
  companyName: z.string().trim().max(160).optional(),
  resumeText: shortText(100_000),
  jobDescription: z.string().trim().max(50_000).optional(),
});

export const opportunityStatusSchema = z.enum(["new", "saved", "dismissed", "applied"]);

export const applicationDraftSchema = z.object({
  opportunityId: uuidSchema,
  subject: shortText(200),
  body: shortText(20_000),
  authorized: z.literal(true),
  idempotencyKey: z.string().uuid(),
});

export const pipelineStageSchema = z.enum([
  "saved",
  "draft",
  "applied",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const manualApplicationSchema = z.object({
  company: shortText(160),
  title: shortText(160),
  notes: z.string().trim().max(10_000).optional(),
});

export const applicationDocumentSchema = z.object({
  opportunityId: uuidSchema.optional(),
  documentType: z.enum(["cover_letter", "resume_variant"]),
  title: shortText(180),
  content: shortText(100_000),
});

export const journeyRequestSchema = z.object({
  currentRole: z.string().trim().max(160).optional(),
  targetRole: shortText(160),
  longTermGoals: z.array(shortText(120)).max(10).default([]),
  targetCompanies: z.string().trim().max(2_000).default(""),
});

export const journeyPlanSchema = z.object({
  journeyTitle: shortText(200),
  summary: shortText(2_000),
  milestones: z.array(z.object({
    stage_key: z.enum(["find", "grow", "advance", "lead", "build"]),
    title: shortText(200),
    target_date: z.string().date(),
    target_role: shortText(160),
    description: shortText(2_000),
    skills: z.array(shortText(100)).max(20),
    actions: z.array(z.object({
      title: shortText(200),
      type: z.enum(["application", "learning", "networking", "portfolio", "interview"]),
    })).max(20),
  })).min(1).max(8),
});

export type JourneyPlan = z.infer<typeof journeyPlanSchema>;

export function decodeBase64(base64: string): Buffer {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error("Invalid file encoding");
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
    throw new Error("Resume files must be between 1 byte and 5 MB");
  }
  return bytes;
}

export function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() || "resume.pdf";
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
  return safe.slice(-180) || "resume.pdf";
}
