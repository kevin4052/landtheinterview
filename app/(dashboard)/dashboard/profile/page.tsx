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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile</h1>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity"
        >
          ← Dashboard
        </a>
      </div>

      {/* slim stats strip */}
      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-3.5 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Name</span>
          <span className="text-sm font-bold text-slate-800">{profile.name}</span>
        </div>
        <div className="h-4 w-px bg-neutral-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Jobs</span>
          <span className="text-sm font-bold text-slate-800">{profile.workExperience.length}</span>
        </div>
        <div className="h-4 w-px bg-neutral-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Schools</span>
          <span className="text-sm font-bold text-slate-800">{profile.education.length}</span>
        </div>
        <div className="h-4 w-px bg-neutral-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Skill categories</span>
          <span className="text-sm font-bold text-slate-800">{profile.skillCategories.length}</span>
        </div>
      </div>

      {/* 2-col content grid */}
      <div className="grid grid-cols-3 gap-5 items-start">
        {/* left narrow col: personal info + skills */}
        <div className="space-y-5">
          <PersonalInfoSection name={profile.name} email={profile.email} />
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
