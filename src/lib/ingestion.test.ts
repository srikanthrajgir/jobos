import { describe, expect, it } from "vitest";
import { assertAllowedSourceUrl, normalizeGreenhouse, normalizeLever, plainTextFromHtml, type JobSource } from "./ingestion";

const greenhouse: JobSource = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Acme",
  source_type: "greenhouse",
  base_url: "https://boards-api.greenhouse.io/v1/boards/acme/jobs",
};

describe("job ingestion", () => {
  it("allows only official source endpoints", () => {
    expect(assertAllowedSourceUrl(greenhouse.base_url, "greenhouse").searchParams.get("content")).toBe("true");
    expect(() => assertAllowedSourceUrl("http://boards-api.greenhouse.io/v1/boards/acme/jobs", "greenhouse")).toThrow();
    expect(() => assertAllowedSourceUrl("https://example.com/v1/boards/acme/jobs", "greenhouse")).toThrow();
    expect(() => assertAllowedSourceUrl("https://api.lever.co/v0/postings/acme/extra", "lever")).toThrow();
  });

  it("normalizes Greenhouse jobs and removes HTML", () => {
    const result = normalizeGreenhouse(greenhouse, { jobs: [{
      id: 42,
      name: "Engineer",
      absolute_url: "https://boards.greenhouse.io/acme/jobs/42",
      content: "<p>Build &amp; ship</p><script>alert(1)</script>",
      location: { name: "Sydney, NSW" },
    }] }, "2026-08-31T00:00:00.000Z");
    expect(result[0]).toMatchObject({ external_job_id: "42", title: "Engineer", suburb: "Sydney", state: "NSW" });
    expect(result[0].description_excerpt).toBe("Build & ship");
    expect(result[0].content_hash).toHaveLength(64);
  });

  it("normalizes Lever postings", () => {
    const source: JobSource = { id: greenhouse.id, name: "Acme", source_type: "lever", base_url: "https://api.lever.co/v0/postings/acme" };
    const result = normalizeLever(source, [{
      id: "abc",
      text: "Product Designer",
      hostedUrl: "https://jobs.lever.co/acme/abc",
      applyUrl: "https://jobs.lever.co/acme/abc/apply",
      descriptionPlain: "Design useful products",
      categories: { location: "Melbourne, VIC", commitment: "Full-time" },
    }]);
    expect(result[0]).toMatchObject({ external_job_id: "abc", suburb: "Melbourne", state: "VIC", employment_type: "Full-time" });
  });

  it("strips scripts and tags from source HTML", () => {
    expect(plainTextFromHtml("<style>x</style><b>Hello</b>&nbsp;world")).toBe("Hello world");
  });
});
