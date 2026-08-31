import { describe, expect, it } from "vitest";
import { isAuthorizedBearer, normalizeHeaderText, safeRedirectPath, secureEqual } from "./security";

describe("security helpers", () => {
  it("compares equal secrets without accepting length mismatches", () => {
    expect(secureEqual("same", "same")).toBe(true);
    expect(secureEqual("same", "different")).toBe(false);
  });

  it("requires a strong exact bearer secret", () => {
    const secret = "a".repeat(32);
    expect(isAuthorizedBearer(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedBearer("Bearer short", "short")).toBe(false);
    expect(isAuthorizedBearer(null, secret)).toBe(false);
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeRedirectPath("/app/pipeline?view=board")).toBe("/app/pipeline?view=board");
    expect(safeRedirectPath("//evil.example")).toBe("/app");
    expect(safeRedirectPath("https://evil.example/app")).toBe("/app");
  });

  it("removes newline injection from header text", () => {
    expect(normalizeHeaderText("Role\r\nBcc: attacker@example.com", 200)).toBe("Role Bcc: attacker@example.com");
  });
});
