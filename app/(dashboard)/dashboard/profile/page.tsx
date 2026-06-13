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
    <div className="px-6 py-6 space-y-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Profile</h1>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-[2px] border border-forest px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-paper"
        >
          ← Dashboard
        </a>
      </div>

      {/* slim stats strip */}
      <div className="flex items-center gap-6 rounded-[2px] border border-line-ink bg-card px-5 py-3.5">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Name</span>
          <span className="font-serif text-base font-medium text-ink">{profile.name}</span>
        </div>
        <div className="h-4 w-px bg-line-ink shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Jobs</span>
          <span className="font-serif text-base font-medium text-ink">{profile.workExperience.length}</span>
        </div>
        <div className="h-4 w-px bg-line-ink shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Schools</span>
          <span className="font-serif text-base font-medium text-ink">{profile.education.length}</span>
        </div>
        <div className="h-4 w-px bg-line-ink shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Skill categories</span>
          <span className="font-serif text-base font-medium text-ink">{profile.skillCategories.length}</span>
        </div>
      </div>

      {/* 2-col content grid */}
      <div className="grid grid-cols-3 gap-5 items-start">
        {/* left narrow col: personal info + skills */}
        <div className="space-y-5">
          <PersonalInfoSection
            name={profile.name}
            email={profile.email}
            phone={profile.phone}
            location={profile.location}
            contactLinks={profile.contactLinks}
          />
          <SkillsSection initialCategories={profile.skillCategories} />
        </div>

        {/* right 2-col span: work experience + education */}
        <div className="col-span-2 space-y-5">
          <WorkExperienceSection initialEntries={sortedWorkExperience} />
          <EducationSection initialEntries={profile.education} />
        </div>
      </div>
    </div>
  );
}
