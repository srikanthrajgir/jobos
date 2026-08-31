import { describe, expect, it } from "vitest";
import { extractOpenAIText } from "./response";

describe("OpenAI response parsing", () => {
  it("uses the convenience output field", () => {
    expect(extractOpenAIText({ output_text: "  hello  " })).toBe("hello");
  });

  it("falls back to output message parts", () => {
    expect(extractOpenAIText({ output: [{ content: [{ type: "output_text", text: "first" }, { type: "output_text", text: "second" }] }] })).toBe("first\nsecond");
  });

  it("fails closed when no text exists", () => {
    expect(() => extractOpenAIText({ output: [] })).toThrow("no text output");
  });
});
