import "server-only";

import { z } from "zod";
import { getOpenAIConfig } from "@/lib/env";
import { journeyPlanSchema, type JourneyPlan } from "@/lib/validation";
import { extractOpenAIText, type OpenAIResponseShape } from "./response";

export type OpportunityForAI = {
  id: string;
  title: string;
  company_name?: string | null;
  description_excerpt?: string | null;
  skills?: string[] | null;
  suburb?: string | null;
  state?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
};

export type RankedOpportunity = {
  opportunity_id: string;
  match_category: "Strong Match" | "Good Match" | "Stretch Opportunity";
  match_score: number;
  match_reasons: string[];
  potential_gaps: string[];
  recommended_approach: string;
};

export type ApplicationEmailDraft = { subject: string; body: string };

const rankedOpportunitySchema = z.object({
  opportunity_id: z.string().uuid(),
  match_category: z.enum(["Strong Match", "Good Match", "Stretch Opportunity"]),
  match_score: z.number().int().min(0).max(100),
  match_reasons: z.array(z.string().trim().min(1).max(500)).max(4),
  potential_gaps: z.array(z.string().trim().min(1).max(500)).max(4),
  recommended_approach: z.string().trim().min(1).max(2_000),
}).strict();

const applicationEmailDraftSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20_000),
}).strict();
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateText(promptName: "fit_gap" | "cover_letter", payload: Record<string, unknown>): Promise<string>;
  extractResumeText(fileBase64: string, mimeType: string, filename: string): Promise<string>;
  generateJourney(payload: Record<string, unknown>): Promise<JourneyPlan>;
  rankOpportunities(userProfile: Record<string, unknown>, opportunities: OpportunityForAI[]): Promise<RankedOpportunity[]>;
  draftApplicationEmail(userProfile: Record<string, unknown>, opportunity: OpportunityForAI): Promise<ApplicationEmailDraft>;
}

type JsonSchema = Record<string, unknown>;
type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_file"; filename: string; file_data: string };

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const config = getOpenAIConfig();
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  private async createResponse(
    instructions: string,
    content: InputContent[],
    format?: { name: string; schema: JsonSchema },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        instructions,
        input: [{ role: "user", content }],
        max_output_tokens: 4_000,
        ...(format
          ? { text: { format: { type: "json_schema", name: format.name, strict: true, schema: format.schema } } }
          : {}),
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    if (!response.ok) {
      // The status alone cannot distinguish a bad model from a bad key, and the
      // body is the only place that says which. Take just the machine-readable
      // code — never the prose, which can quote the prompt back.
      let reason = "";
      try {
        const body = await response.json() as { error?: { code?: string; type?: string } };
        const code = body.error?.code || body.error?.type;
        if (code) reason = ` (${String(code).slice(0, 60)})`;
      } catch {
        // Non-JSON body (gateway HTML, empty 502): the status stands on its own.
      }
      throw new Error(`AI provider request failed with status ${response.status}${reason}`);
    }
    const payload = await response.json() as OpenAIResponseShape;
    return extractOpenAIText(payload);
  }

  async generateText(promptName: "fit_gap" | "cover_letter", payload: Record<string, unknown>): Promise<string> {
    const jobTitle = String(payload.jobTitle || "the role").slice(0, 160);
    const companyName = String(payload.companyName || "the employer").slice(0, 160);
    const resumeText = String(payload.resumeText || "").slice(0, 100_000);
    const jobDescription = String(payload.jobDescription || "").slice(0, 50_000);

    if (promptName === "fit_gap") {
      return this.createResponse(
        "You are a careful Australian career coach. Compare only the supplied evidence. Clearly separate verified strengths, partial matches, gaps, and next actions. Do not invent credentials. Return concise Markdown.",
        [{ type: "input_text", text: `Role: ${jobTitle}\n\nJob description:\n${jobDescription || "Not supplied"}\n\nCandidate resume:\n${resumeText}` }],
      );
    }

    return this.createResponse(
      "Draft a concise, truthful Australian English cover letter using only facts in the supplied resume. Never invent experience, qualifications, metrics, or contact details. Return plain text with no Markdown fences.",
      [{ type: "input_text", text: `Role: ${jobTitle}\nCompany: ${companyName}\n\nJob description:\n${jobDescription || "Not supplied"}\n\nCandidate resume:\n${resumeText}` }],
    );
  }

  async extractResumeText(fileBase64: string, mimeType: string, filename: string): Promise<string> {
    return this.createResponse(
      "Extract the candidate's resume faithfully. Preserve names, contact details, dates, employers, roles, education, skills and achievements. Do not infer or add facts. Return clean plain text suitable for editing.",
      [
        { type: "input_file", filename, file_data: `data:${mimeType};base64,${fileBase64}` },
        { type: "input_text", text: "Extract all resume content accurately." },
      ],
    );
  }

  async generateJourney(payload: Record<string, unknown>): Promise<JourneyPlan> {
    const schema: JsonSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        journeyTitle: { type: "string" },
        summary: { type: "string" },
        milestones: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              stage_key: { type: "string", enum: ["find", "grow", "advance", "lead", "build"] },
              title: { type: "string" },
              target_date: { type: "string" },
              target_role: { type: "string" },
              description: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    type: { type: "string", enum: ["application", "learning", "networking", "portfolio", "interview"] },
                  },
                  required: ["title", "type"],
                },
              },
            },
            required: ["stage_key", "title", "target_date", "target_role", "description", "skills", "actions"],
          },
        },
      },
      required: ["journeyTitle", "summary", "milestones"],
    };

    const text = await this.createResponse(
      "Create a realistic career journey with dated, measurable milestones. Use Australian English. Dates must be YYYY-MM-DD and in the future. Do not promise employment outcomes.",
      [{ type: "input_text", text: JSON.stringify(payload).slice(0, 20_000) }],
      { name: "job_journey", schema },
    );
    return journeyPlanSchema.parse(JSON.parse(text));
  }

  async rankOpportunities(userProfile: Record<string, unknown>, opportunities: OpportunityForAI[]): Promise<RankedOpportunity[]> {
    const schema: JsonSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        rankings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              opportunity_id: { type: "string" },
              match_category: { type: "string", enum: ["Strong Match", "Good Match", "Stretch Opportunity"] },
              match_score: { type: "integer", minimum: 0, maximum: 100 },
              match_reasons: { type: "array", items: { type: "string" }, maxItems: 4 },
              potential_gaps: { type: "array", items: { type: "string" }, maxItems: 4 },
              recommended_approach: { type: "string" },
            },
            required: ["opportunity_id", "match_category", "match_score", "match_reasons", "potential_gaps", "recommended_approach"],
          },
        },
      },
      required: ["rankings"],
    };

    const text = await this.createResponse(
      "Rank jobs against the supplied candidate evidence. Do not infer protected characteristics. Prioritise target role, verified skills, location, work arrangement and employment type. Explain evidence-based reasons and gaps. Return each supplied opportunity at most once.",
      [{ type: "input_text", text: JSON.stringify({ userProfile, opportunities }).slice(0, 180_000) }],
      { name: "opportunity_rankings", schema },
    );
    const parsed = z.object({ rankings: z.array(rankedOpportunitySchema).max(100) }).strict().parse(JSON.parse(text));
    const allowedIds = new Set(opportunities.map((item) => item.id));
    const seen = new Set<string>();
    return parsed.rankings
      .filter((item) => {
        if (!allowedIds.has(item.opportunity_id) || seen.has(item.opportunity_id)) return false;
        seen.add(item.opportunity_id);
        return true;
      })
      .sort((a, b) => b.match_score - a.match_score);
  }

  async draftApplicationEmail(userProfile: Record<string, unknown>, opportunity: OpportunityForAI): Promise<ApplicationEmailDraft> {
    const schema: JsonSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: { type: "string", maxLength: 200 },
        body: { type: "string", maxLength: 20_000 },
      },
      required: ["subject", "body"],
    };
    const text = await this.createResponse(
      "Draft a concise application email in Australian English. Use only supplied facts, do not invent experience, and do not claim an attachment unless a resume is available. Keep the subject under 200 characters.",
      [{ type: "input_text", text: JSON.stringify({ userProfile, opportunity }).slice(0, 100_000) }],
      { name: "application_email", schema },
    );
    return applicationEmailDraftSchema.parse(JSON.parse(text));
  }
}

class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-local";

  async generateText(promptName: "fit_gap" | "cover_letter", payload: Record<string, unknown>): Promise<string> {
    if (promptName === "fit_gap") return `Fit analysis for ${String(payload.jobTitle || "role")}. Configure OPENAI_API_KEY for evidence-based output.`;
    return `Application draft for ${String(payload.jobTitle || "role")}. Configure OPENAI_API_KEY for a tailored draft.`;
  }

  async extractResumeText(): Promise<string> {
    return "Mock resume extraction. Configure OPENAI_API_KEY for document extraction.";
  }

  async generateJourney(payload: Record<string, unknown>): Promise<JourneyPlan> {
    const nextYear = new Date();
    nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
    return {
      journeyTitle: `Journey to ${String(payload.targetRole || "your target role")}`,
      summary: "A practical route to the next career milestone.",
      milestones: [{
        stage_key: "find",
        title: "Build a focused search",
        target_date: nextYear.toISOString().slice(0, 10),
        target_role: String(payload.targetRole || "Target role"),
        description: "Validate target roles and build an evidence-based application plan.",
        skills: ["Communication"],
        actions: [{ title: "Review five suitable roles", type: "application" }],
      }],
    };
  }

  async rankOpportunities(_userProfile: Record<string, unknown>, opportunities: OpportunityForAI[]): Promise<RankedOpportunity[]> {
    return opportunities.map((opportunity, index) => ({
      opportunity_id: opportunity.id,
      match_category: index === 0 ? "Strong Match" : "Good Match",
      match_score: Math.max(50, 90 - index * 4),
      match_reasons: ["Matches the configured target role."],
      potential_gaps: ["Verify the detailed requirements before applying."],
      recommended_approach: "Tailor the resume to the verified role requirements.",
    }));
  }

  async draftApplicationEmail(_userProfile: Record<string, unknown>, opportunity: OpportunityForAI): Promise<ApplicationEmailDraft> {
    return {
      subject: `Application: ${opportunity.title}`,
      body: `Dear Hiring Manager,\n\nPlease accept my application for the ${opportunity.title} role.\n\nKind regards`,
    };
  }
}

export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "mock") {
    if (process.env.NODE_ENV === "production") throw new Error("Mock AI provider is disabled in production");
    return new MockAIProvider();
  }
  return new OpenAIProvider();
}
