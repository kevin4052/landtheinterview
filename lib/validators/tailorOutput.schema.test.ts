import { describe, it, expect } from "vitest";
import { TailorOutputSchema } from "./tailorOutput.schema";

const VALID_RESUME = {
  name: "Jane Smith",
  contact: ["jane@example.com"],
  sections: [
    {
      title: "Experience",
      type: "experience",
      entries: [{ heading: "Acme Corp", bullets: ["Led team of 5"] }],
    },
  ],
};

describe("TailorOutputSchema", () => {
  it("accepts a valid wrapper with both metadata fields", () => {
    const result = TailorOutputSchema.safeParse({
      resume: VALID_RESUME,
      jobTitle: "Software Engineer",
      companyName: "Acme Corp",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid wrapper with null metadata fields", () => {
    const result = TailorOutputSchema.safeParse({
      resume: VALID_RESUME,
      jobTitle: null,
      companyName: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when resume field is missing", () => {
    const result = TailorOutputSchema.safeParse({
      jobTitle: "Software Engineer",
      companyName: "Acme Corp",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when resume fails ResumeJSONSchema validation", () => {
    const result = TailorOutputSchema.safeParse({
      resume: { name: "Jane", contact: [], sections: [{ title: "X", type: "invalid-type", entries: [] }] },
      jobTitle: null,
      companyName: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when jobTitle is missing", () => {
    const result = TailorOutputSchema.safeParse({
      resume: VALID_RESUME,
      companyName: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when companyName is missing", () => {
    const result = TailorOutputSchema.safeParse({
      resume: VALID_RESUME,
      jobTitle: null,
    });
    expect(result.success).toBe(false);
  });
});
