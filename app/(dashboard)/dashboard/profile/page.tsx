import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/db/profile";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { WorkExperienceSection } from "./WorkExperienceSection";
import { EducationSection } from "./EducationSection";
import { SkillsSection } from "./SkillsSection";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) notFound();

  const profile = await getProfile();
  if (!profile) notFound();

  const sortedWorkExperience = [...profile.workExperience].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
      <PersonalInfoSection name={profile.name} email={profile.email} />
      <WorkExperienceSection initialEntries={sortedWorkExperience} />
      <EducationSection initialEntries={profile.education} />
      <SkillsSection initialCategories={profile.skillCategories} />
    </main>
  );
}
