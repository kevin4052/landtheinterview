import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

const PROFICIENCY_LABELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  professional: "Professional",
  conversational: "Conversational",
  basic: "Basic",
};

export function resumeToText(resume: ResumeJSON): string {
  const lines: string[] = [];

  lines.push(resume.name);
  if (resume.contact.length > 0) {
    lines.push(resume.contact.join(" | "));
  }
  lines.push("");

  if (resume.summary) {
    lines.push(resume.summary);
    lines.push("");
  }

  for (const section of resume.sections) {
    lines.push(section.title.toUpperCase());
    for (const entry of section.entries) {
      const headerParts: string[] = [];
      if (entry.heading) headerParts.push(entry.heading);
      if (entry.subheading) headerParts.push(entry.subheading);
      if (entry.date) headerParts.push(entry.date);
      if (headerParts.length > 0) {
        lines.push(headerParts.join(" | "));
      }
      if (entry.body) lines.push(entry.body);
      if (entry.level) {
        lines.push(PROFICIENCY_LABELS[entry.level] ?? entry.level);
      }
      if (entry.bullets) {
        for (const bullet of entry.bullets) {
          lines.push(`- ${bullet}`);
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
