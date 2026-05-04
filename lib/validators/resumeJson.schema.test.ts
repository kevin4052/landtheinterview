import { describe, it, expect } from "vitest";
import { ResumeJSONSchema } from "./resumeJson.schema";

const VALID_RESUME = {
  name: "Jane Smith",
  contact: ["jane@example.com", "555-0100", "San Francisco, CA"],
  summary: "Software engineer with 5 years of experience.",
  sections: [
    {
      title: "Experience",
      type: "experience",
      entries: [
        {
          heading: "Acme Corp",
          subheading: "Senior Engineer",
          date: "2021 – Present",
          bullets: ["Led migration to microservices", "Reduced latency by 40%"],
        },
      ],
    },
    {
      title: "Skills",
      type: "skills",
      entries: [{ heading: "Languages", body: "TypeScript, Go, Python" }],
    },
    {
      title: "Languages",
      type: "languages",
      entries: [
        { heading: "English", level: "native" },
        { heading: "Spanish", level: "professional" },
      ],
    },
  ],
};

describe("ResumeJSONSchema", () => {
  it("accepts a well-formed object", () => {
    const result = ResumeJSONSchema.safeParse(VALID_RESUME);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal object without optional fields", () => {
    const result = ResumeJSONSchema.safeParse({
      name: "John Doe",
      contact: [],
      sections: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const { name: _name, ...rest } = VALID_RESUME;
    const result = ResumeJSONSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when contact is missing", () => {
    const { contact: _contact, ...rest } = VALID_RESUME;
    const result = ResumeJSONSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when sections is missing", () => {
    const { sections: _sections, ...rest } = VALID_RESUME;
    const result = ResumeJSONSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid SectionType", () => {
    const bad = {
      ...VALID_RESUME,
      sections: [{ title: "Foo", type: "hobbies", entries: [] }],
    };
    const result = ResumeJSONSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid ProficiencyLevel on a language entry", () => {
    const bad = {
      ...VALID_RESUME,
      sections: [
        {
          title: "Languages",
          type: "languages",
          entries: [{ heading: "French", level: "expert" }],
        },
      ],
    };
    const result = ResumeJSONSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("accepts all valid SectionType values", () => {
    const types = [
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "other",
    ] as const;
    for (const type of types) {
      const result = ResumeJSONSchema.safeParse({
        name: "Test",
        contact: [],
        sections: [{ title: "Section", type, entries: [] }],
      });
      expect(result.success, `type "${type}" should be valid`).toBe(true);
    }
  });

  it("accepts all valid ProficiencyLevel values", () => {
    const levels = [
      "native",
      "fluent",
      "professional",
      "conversational",
      "basic",
    ] as const;
    for (const level of levels) {
      const result = ResumeJSONSchema.safeParse({
        name: "Test",
        contact: [],
        sections: [
          {
            title: "Languages",
            type: "languages",
            entries: [{ heading: "French", level }],
          },
        ],
      });
      expect(result.success, `level "${level}" should be valid`).toBe(true);
    }
  });
});
