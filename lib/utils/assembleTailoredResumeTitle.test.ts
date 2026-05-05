import { describe, it, expect } from "vitest";
import { assembleTailoredResumeTitle } from "./assembleTailoredResumeTitle";

const DATE = new Date("2026-05-04T12:00:00Z");

describe("assembleTailoredResumeTitle", () => {
  it("returns 'Job Title - Company Name' when both are present", () => {
    expect(assembleTailoredResumeTitle("Software Engineer", "Acme Corp", DATE)).toBe(
      "Software Engineer - Acme Corp"
    );
  });

  it("returns job title alone when only jobTitle is present", () => {
    expect(assembleTailoredResumeTitle("Software Engineer", null, DATE)).toBe(
      "Software Engineer"
    );
  });

  it("returns company name alone when only companyName is present", () => {
    expect(assembleTailoredResumeTitle(null, "Acme Corp", DATE)).toBe("Acme Corp");
  });

  it("returns date fallback when both are null", () => {
    const result = assembleTailoredResumeTitle(null, null, DATE);
    expect(result).toMatch(/^Resume - /);
  });

  it("treats empty jobTitle as absent", () => {
    expect(assembleTailoredResumeTitle("", "Acme Corp", DATE)).toBe("Acme Corp");
  });

  it("treats empty companyName as absent", () => {
    expect(assembleTailoredResumeTitle("Software Engineer", "", DATE)).toBe(
      "Software Engineer"
    );
  });

  it("returns date fallback when both are empty strings", () => {
    const result = assembleTailoredResumeTitle("", "", DATE);
    expect(result).toMatch(/^Resume - /);
  });

  it("treats undefined jobTitle the same as null", () => {
    expect(assembleTailoredResumeTitle(undefined, "Acme Corp", DATE)).toBe("Acme Corp");
  });

  it("treats undefined companyName the same as null", () => {
    expect(assembleTailoredResumeTitle("Software Engineer", undefined, DATE)).toBe(
      "Software Engineer"
    );
  });

  it("returns date fallback when both are undefined", () => {
    const result = assembleTailoredResumeTitle(undefined, undefined, DATE);
    expect(result).toMatch(/^Resume - /);
  });

  it("trims whitespace before checking presence", () => {
    expect(assembleTailoredResumeTitle("  ", "Acme Corp", DATE)).toBe("Acme Corp");
  });
});
