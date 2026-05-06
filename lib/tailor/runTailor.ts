import "server-only";
import type { FullProfile } from "@/lib/db/profile";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";
import { serializeProfileToResumeText } from "@/lib/serializers/profileSerializer";
import { tailorResume } from "@/lib/ai/tailorResume";

export type RunTailorResult = {
  resumeJson: ResumeJSON;
  resumeText: string;
  jobTitle: string | null;
  companyName: string | null;
};

export async function runTailor(
  profile: FullProfile,
  jobText: string
): Promise<RunTailorResult> {
  const resumeText = serializeProfileToResumeText(profile);
  const { resume: resumeJson, jobTitle, companyName } = await tailorResume(
    resumeText,
    jobText
  );
  return { resumeJson, resumeText, jobTitle, companyName };
}
