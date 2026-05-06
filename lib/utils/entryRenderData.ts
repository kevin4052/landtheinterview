import type { Entry, SectionType } from "@/lib/validators/resumeJson.schema";

const PROFICIENCY_LABELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  professional: "Professional",
  conversational: "Conversational",
  basic: "Basic",
};

export type EntryRenderData =
  | { kind: "language"; label: string; proficiency: string | null }
  | { kind: "skill"; label: string | null; value: string }
  | {
      kind: "default";
      heading: string | null;
      subheading: string | null;
      date: string | null;
      body: string | null;
      bullets: string[];
    };

export function extractEntryRenderData(
  entry: Entry,
  sectionType: SectionType
): EntryRenderData {
  if (sectionType === "languages") {
    return {
      kind: "language",
      label: entry.heading ?? "",
      proficiency: entry.level ? (PROFICIENCY_LABELS[entry.level] ?? entry.level) : null,
    };
  }

  if (sectionType === "skills") {
    return {
      kind: "skill",
      label: entry.heading ?? null,
      value: entry.body ?? entry.bullets?.join(", ") ?? "",
    };
  }

  return {
    kind: "default",
    heading: entry.heading ?? null,
    subheading: entry.subheading ?? null,
    date: entry.date ?? null,
    body: entry.body ?? null,
    bullets: entry.bullets ?? [],
  };
}
