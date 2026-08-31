import { describe, expect, it } from "vitest";
import { decodeBase64, journeyRequestSchema, pipelineStageSchema, sanitizeFilename, signupSchema } from "./validation";

describe("input validation", () => {
  it("requires strong signup passwords", () => {
    expect(signupSchema.safeParse({ email: "person@example.com", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "person@example.com", password: "long-enough-password" }).success).toBe(true);
  });

  it("accepts only known pipeline stages", () => {
    expect(pipelineStageSchema.parse("interview")).toBe("interview");
    expect(() => pipelineStageSchema.parse("admin")).toThrow();
  });

  it("accepts the job journey wizard payload", () => {
    const result = journeyRequestSchema.parse({
      currentRole: "Coordinator",
      targetRole: "Project Manager",
      longTermGoals: ["Move into management"],
      targetCompanies: "Example Co",
    });
    expect(result.longTermGoals).toEqual(["Move into management"]);
  });

  it("sanitizes uploaded filenames and rejects malformed base64", () => {
    expect(sanitizeFilename("../../my resume.pdf")).toBe("my_resume.pdf");
    expect(() => decodeBase64("not base64!" )).toThrow();
  });
});
