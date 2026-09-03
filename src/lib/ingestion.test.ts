import { describe, expect, it } from "vitest";
import { assertAllowedSourceUrl, locationKey, normalizeGreenhouse, normalizeLever, plainTextFromHtml, type JobSource } from "./ingestion";

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
      // `title` is the real Job Board API field. The fixture previously said
      // `name`, which is why the suite passed while every live Greenhouse
      // posting was rejected.
      title: "Engineer",
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

describe("locationKey", () => {
  it("matches the keys seeded in the geocode cache migration", () => {
    // Greenhouse reports "Sydney, Australia", which yields a null state, so the
    // key must be the bare suburb for the seeded row to hit.
    expect(locationKey("Sydney", null)).toBe("sydney");
    expect(locationKey("Sydney", "NSW")).toBe("sydney, nsw");
    expect(locationKey("Gold Coast", "QLD")).toBe("gold coast, qld");
  });

  it("normalises casing and internal whitespace so one locality is one cache row", () => {
    expect(locationKey("  MELBOURNE  ", " vic ")).toBe("melbourne, vic");
    expect(locationKey("Gold  Coast", null)).toBe("gold coast");
  });

  it("returns null when there is no suburb to key on", () => {
    expect(locationKey(null, "NSW")).toBeNull();
    expect(locationKey("", "NSW")).toBeNull();
    expect(locationKey("   ", null)).toBeNull();
  });
});

describe("Greenhouse payload shape", () => {
  it("rejects a posting with no title, and accepts the live field shape", () => {
    // Guards the regression directly: a payload keyed on `name` must fail.
    expect(() => normalizeGreenhouse(greenhouse, {
      jobs: [{ id: 1, name: "Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/1" }],
    })).toThrow(/missing required fields/);

    // The shape the Job Board API actually returns.
    const result = normalizeGreenhouse(greenhouse, {
      jobs: [{
        id: 8130725,
        title: "Account Executive, AI Sales",
        absolute_url: "https://stripe.com/jobs/search?gh_jid=8130725",
        location: { name: "Sydney, Australia" },
        departments: [{ name: "Sales" }],
      }],
    });
    expect(result[0]).toMatchObject({
      external_job_id: "8130725",
      title: "Account Executive, AI Sales",
      suburb: "Sydney",
      state: null,
      department: "Sales",
      latitude: null,
      longitude: null,
    });
    // "Sydney, Australia" names no state, so the cache key is the bare suburb.
    expect(locationKey(result[0].suburb, result[0].state)).toBe("sydney");
  });
});
