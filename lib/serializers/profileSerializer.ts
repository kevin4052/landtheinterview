import type { FullProfile } from "@/lib/db/profile";

type WorkExp = FullProfile["workExperience"][number];
type Education = FullProfile["education"][number];
type SkillCat = FullProfile["skillCategories"][number];
type Project = FullProfile["personalProjects"][number];

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

// Entries arrive in creation order from getProfile and are not re-sorted here.
function serializePersonalProjects(entries: Project[]): string {
  return entries
    .map((entry) => {
      const header = entry.url ? `${entry.title} | ${entry.url}` : entry.title;
      const bullets = entry.bullets.map((b) => `- ${b}`).join("\n");
      return [header, bullets].filter(Boolean).join("\n");
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

  const contact = [
    profile.name,
    profile.email,
    profile.phone,
    profile.location,
    ...profile.contactLinks.map((link) => `${link.label}: ${link.url}`),
  ]
    .filter(Boolean)
    .join("\n");
  sections.push(contact);

  if (profile.workExperience.length > 0) {
    sections.push("WORK EXPERIENCE\n" + serializeWorkExperience(profile.workExperience));
  }

  if (profile.personalProjects.length > 0) {
    sections.push("PROJECTS\n" + serializePersonalProjects(profile.personalProjects));
  }

  if (profile.education.length > 0) {
    sections.push("EDUCATION\n" + serializeEducation(profile.education));
  }

  if (profile.skillCategories.length > 0) {
    sections.push("SKILLS\n" + serializeSkillCategories(profile.skillCategories));
  }

  return sections.join("\n\n");
}
