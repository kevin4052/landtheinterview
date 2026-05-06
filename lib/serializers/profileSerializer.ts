import type { FullProfile } from "@/lib/db/profile";

type WorkExp = FullProfile["workExperience"][number];
type Education = FullProfile["education"][number];
type SkillCat = FullProfile["skillCategories"][number];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(start: Date, end: Date | null, isCurrent: boolean): string {
  const startStr = formatDate(start);
  const endStr = isCurrent ? "Present" : end ? formatDate(end) : "";
  return endStr ? `${startStr} – ${endStr}` : startStr;
}

function serializeWorkExperience(entries: WorkExp[]): string {
  const sorted = [...entries].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return b.startDate.getTime() - a.startDate.getTime();
  });

  return sorted
    .map((entry) => {
      const header = `${entry.title} | ${entry.company} | ${formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}`;
      const location = entry.location ? `${entry.location}` : "";
      const bullets = entry.bullets.map((b) => `- ${b}`).join("\n");
      return [header, location, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function serializeEducation(entries: Education[]): string {
  return entries
    .map((entry) => {
      const dateRange = formatDateRange(entry.startDate, entry.endDate, entry.isCurrent);
      return `${entry.degree} in ${entry.fieldOfStudy} | ${entry.school} | ${dateRange}`;
    })
    .join("\n");
}

function serializeSkillCategories(entries: SkillCat[]): string {
  return entries.map((cat) => `${cat.name}: ${cat.skills.join(", ")}`).join("\n");
}

export function serializeProfileToResumeText(profile: FullProfile): string {
  const sections: string[] = [];

  sections.push(profile.name);
  sections.push(profile.email);

  if (profile.workExperience.length > 0) {
    sections.push("WORK EXPERIENCE\n" + serializeWorkExperience(profile.workExperience));
  }

  if (profile.education.length > 0) {
    sections.push("EDUCATION\n" + serializeEducation(profile.education));
  }

  if (profile.skillCategories.length > 0) {
    sections.push("SKILLS\n" + serializeSkillCategories(profile.skillCategories));
  }

  return sections.join("\n\n");
}
