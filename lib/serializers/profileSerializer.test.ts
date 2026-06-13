import { describe, it, expect } from "vitest";
import { serializeProfileToResumeText } from "./profileSerializer";
import type { FullProfile } from "@/lib/db/profile";

function makeProfile(overrides: Partial<FullProfile> = {}): FullProfile {
  return {
    id: "p1",
    tenantId: "tenant_123",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: null,
    location: null,
    contactLinks: [],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    workExperience: [],
    education: [],
    skillCategories: [],
    ...overrides,
  };
}

function makeJob(overrides: Partial<FullProfile["workExperience"][number]> = {}): FullProfile["workExperience"][number] {
  return {
    id: "w1",
    tenantId: "tenant_123",
    profileId: "p1",
    company: "Acme Corp",
    title: "Software Engineer",
    startDate: new Date("2022-01-01"),
    endDate: new Date("2024-06-01"),
    isCurrent: false,
    location: null,
    bullets: ["Built distributed systems"],
    ...overrides,
  };
}

function makeEdu(overrides: Partial<FullProfile["education"][number]> = {}): FullProfile["education"][number] {
  return {
    id: "e1",
    tenantId: "tenant_123",
    profileId: "p1",
    school: "State University",
    degree: "B.S.",
    fieldOfStudy: "Computer Science",
    startDate: new Date("2018-09-01"),
    endDate: new Date("2022-05-01"),
    isCurrent: false,
    ...overrides,
  };
}

function makeSkill(overrides: Partial<FullProfile["skillCategories"][number]> = {}): FullProfile["skillCategories"][number] {
  return {
    id: "s1",
    tenantId: "tenant_123",
    profileId: "p1",
    name: "Languages",
    skills: ["TypeScript", "Python"],
    ...overrides,
  };
}

describe("serializeProfileToResumeText", () => {
  it("includes name and email", () => {
    const result = serializeProfileToResumeText(makeProfile());
    expect(result).toContain("Jane Doe");
    expect(result).toContain("jane@example.com");
  });

  it("renders contact block with phone and location one per line when present", () => {
    const profile = makeProfile({ phone: "555-123-4567", location: "Austin, TX" });
    const result = serializeProfileToResumeText(profile);
    expect(result.startsWith("Jane Doe\njane@example.com\n555-123-4567\nAustin, TX")).toBe(true);
  });

  it("includes phone without location", () => {
    const profile = makeProfile({ phone: "555-123-4567" });
    const result = serializeProfileToResumeText(profile);
    expect(result.startsWith("Jane Doe\njane@example.com\n555-123-4567")).toBe(true);
    expect(result).not.toContain("null");
  });

  it("includes location without phone", () => {
    const profile = makeProfile({ location: "Austin, TX" });
    const result = serializeProfileToResumeText(profile);
    expect(result.startsWith("Jane Doe\njane@example.com\nAustin, TX")).toBe(true);
  });

  it("omits phone and location lines when absent", () => {
    const result = serializeProfileToResumeText(makeProfile());
    expect(result.startsWith("Jane Doe\njane@example.com\n\n") || result === "Jane Doe\njane@example.com").toBe(true);
    expect(result).not.toContain("null");
  });

  it("renders no link lines when there are zero Contact Links", () => {
    const result = serializeProfileToResumeText(makeProfile());
    expect(result.startsWith("Jane Doe\njane@example.com\n\n") || result === "Jane Doe\njane@example.com").toBe(true);
  });

  it("renders a single Contact Link as 'Label: url'", () => {
    const profile = makeProfile({
      contactLinks: [{ label: "LinkedIn", url: "https://linkedin.com/in/jane" }],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result.startsWith("Jane Doe\njane@example.com\nLinkedIn: https://linkedin.com/in/jane")).toBe(true);
  });

  it("renders many Contact Links one per line in stored order", () => {
    const profile = makeProfile({
      contactLinks: [
        { label: "GitHub", url: "https://github.com/jane" },
        { label: "Portfolio", url: "https://jane.dev" },
        { label: "X", url: "https://x.com/jane" },
      ],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain(
      "GitHub: https://github.com/jane\nPortfolio: https://jane.dev\nX: https://x.com/jane"
    );
  });

  it("renders Contact Links after phone and location", () => {
    const profile = makeProfile({
      phone: "555-123-4567",
      location: "Austin, TX",
      contactLinks: [{ label: "GitHub", url: "https://github.com/jane" }],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result.startsWith("Jane Doe\njane@example.com\n555-123-4567\nAustin, TX\nGitHub: https://github.com/jane")).toBe(true);
  });

  it("fully populated profile contains all sections", () => {
    const profile = makeProfile({
      workExperience: [makeJob()],
      education: [makeEdu()],
      skillCategories: [makeSkill()],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain("WORK EXPERIENCE");
    expect(result).toContain("EDUCATION");
    expect(result).toContain("SKILLS");
  });

  it("required-fields-only profile has no empty section headings", () => {
    const result = serializeProfileToResumeText(makeProfile());
    expect(result).not.toContain("WORK EXPERIENCE");
    expect(result).not.toContain("EDUCATION");
    expect(result).not.toContain("SKILLS");
  });

  it("renders isCurrent jobs with Present as end date", () => {
    const profile = makeProfile({
      workExperience: [makeJob({ isCurrent: true, endDate: null })],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain("Present");
  });

  it("isCurrent jobs appear before past jobs", () => {
    const past = makeJob({ id: "w1", company: "Past Co", startDate: new Date("2020-01-01"), endDate: new Date("2022-01-01"), isCurrent: false });
    const current = makeJob({ id: "w2", company: "Current Co", startDate: new Date("2022-01-01"), endDate: null, isCurrent: true });
    const profile = makeProfile({ workExperience: [past, current] });
    const result = serializeProfileToResumeText(profile);
    expect(result.indexOf("Current Co")).toBeLessThan(result.indexOf("Past Co"));
  });

  it("sorts non-current jobs reverse chronologically", () => {
    const older = makeJob({ id: "w1", company: "Old Co", startDate: new Date("2018-01-01"), endDate: new Date("2020-01-01") });
    const newer = makeJob({ id: "w2", company: "New Co", startDate: new Date("2021-01-01"), endDate: new Date("2023-01-01") });
    const profile = makeProfile({ workExperience: [older, newer] });
    const result = serializeProfileToResumeText(profile);
    expect(result.indexOf("New Co")).toBeLessThan(result.indexOf("Old Co"));
  });

  it("renders multiple skill categories", () => {
    const profile = makeProfile({
      skillCategories: [
        makeSkill({ id: "s1", name: "Languages", skills: ["TypeScript"] }),
        makeSkill({ id: "s2", name: "Tools", skills: ["Docker", "Git"] }),
      ],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain("Languages: TypeScript");
    expect(result).toContain("Tools: Docker, Git");
  });

  it("handles empty bullets array without crashing or empty lines", () => {
    const profile = makeProfile({
      workExperience: [makeJob({ bullets: [] })],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain("WORK EXPERIENCE");
    expect(result).not.toMatch(/^-\s*$/m);
  });

  it("omits education section when no education entries", () => {
    const profile = makeProfile({
      workExperience: [makeJob()],
      skillCategories: [makeSkill()],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).not.toContain("EDUCATION");
  });

  it("omits skills section when no skill categories", () => {
    const profile = makeProfile({
      workExperience: [makeJob()],
      education: [makeEdu()],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).not.toContain("SKILLS");
  });

  it("includes work experience details like company, title, and bullets", () => {
    const profile = makeProfile({
      workExperience: [makeJob({ title: "Staff Engineer", company: "BigCo", bullets: ["Led migrations", "Cut costs 30%"] })],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).toContain("Staff Engineer");
    expect(result).toContain("BigCo");
    expect(result).toContain("Led migrations");
    expect(result).toContain("Cut costs 30%");
  });

  it("includes location when present", () => {
    const profile = makeProfile({
      workExperience: [makeJob({ location: "Austin, TX" })],
    });
    expect(serializeProfileToResumeText(profile)).toContain("Austin, TX");
  });

  it("omits location line when null", () => {
    const profile = makeProfile({
      workExperience: [makeJob({ location: null })],
    });
    const result = serializeProfileToResumeText(profile);
    expect(result).not.toMatch(/^null$/m);
  });
});
