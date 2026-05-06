import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/client";

const profileInclude = {
  workExperience: true,
  education: true,
  skillCategories: true,
} satisfies Prisma.UserProfileInclude;

export type FullProfile = Prisma.UserProfileGetPayload<{
  include: typeof profileInclude;
}>;

export async function getProfileByClerkId(
  clerkUserId: string
): Promise<FullProfile | null> {
  return prisma.userProfile.findUnique({
    where: { clerkUserId },
    include: profileInclude,
  });
}

export async function profileIsComplete(
  clerkUserId: string
): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId },
    include: { workExperience: { take: 1 } },
  });
  return profile !== null && profile.workExperience.length > 0;
}

export async function createProfile(
  clerkUserId: string,
  data: { name: string; email: string }
) {
  return prisma.userProfile.create({
    data: { clerkUserId, ...data },
  });
}

// WorkExperience mutations

export type WorkExperienceCreateData = Omit<
  Prisma.WorkExperienceUncheckedCreateInput,
  "id" | "profileId"
>;

export type WorkExperienceUpdateData = Partial<WorkExperienceCreateData>;

export async function createWorkExperience(
  clerkUserId: string,
  data: WorkExperienceCreateData
) {
  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { clerkUserId },
    select: { id: true },
  });
  return prisma.workExperience.create({
    data: { ...data, profileId: profile.id },
  });
}

export async function updateWorkExperience(
  id: string,
  data: WorkExperienceUpdateData
) {
  return prisma.workExperience.update({ where: { id }, data });
}

export async function deleteWorkExperience(id: string) {
  return prisma.workExperience.delete({ where: { id } });
}

// Education mutations

export type EducationCreateData = Omit<
  Prisma.EducationUncheckedCreateInput,
  "id" | "profileId"
>;

export type EducationUpdateData = Partial<EducationCreateData>;

export async function createEducation(
  clerkUserId: string,
  data: EducationCreateData
) {
  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { clerkUserId },
    select: { id: true },
  });
  return prisma.education.create({
    data: { ...data, profileId: profile.id },
  });
}

export async function updateEducation(id: string, data: EducationUpdateData) {
  return prisma.education.update({ where: { id }, data });
}

export async function deleteEducation(id: string) {
  return prisma.education.delete({ where: { id } });
}

// SkillCategory mutations

export type SkillCategoryCreateData = Omit<
  Prisma.SkillCategoryUncheckedCreateInput,
  "id" | "profileId"
>;

export type SkillCategoryUpdateData = Partial<SkillCategoryCreateData>;

export async function createSkillCategory(
  clerkUserId: string,
  data: SkillCategoryCreateData
) {
  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { clerkUserId },
    select: { id: true },
  });
  return prisma.skillCategory.create({
    data: { ...data, profileId: profile.id },
  });
}

export async function updateSkillCategory(
  id: string,
  data: SkillCategoryUpdateData
) {
  return prisma.skillCategory.update({ where: { id }, data });
}

export async function deleteSkillCategory(id: string) {
  return prisma.skillCategory.delete({ where: { id } });
}
