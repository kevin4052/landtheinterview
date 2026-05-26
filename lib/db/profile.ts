import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  userProfiles,
  workExperience,
  education,
  skillCategories,
} from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type WorkExperience = InferSelectModel<typeof workExperience>;
export type Education = InferSelectModel<typeof education>;
export type SkillCategory = InferSelectModel<typeof skillCategories>;

export type FullProfile = InferSelectModel<typeof userProfiles> & {
  workExperience: WorkExperience[];
  education: Education[];
  skillCategories: SkillCategory[];
};

// RLS on user_profiles filters to the current JWT user automatically.
export async function getProfile(): Promise<FullProfile | null> {
  const db = await getDb();
  const profile = await db.query.userProfiles.findFirst({
    with: {
      workExperience: true,
      education: true,
      skillCategories: true,
    },
  });
  return profile ?? null;
}

export async function profileIsComplete(): Promise<boolean> {
  const db = await getDb();
  const profile = await db.query.userProfiles.findFirst({
    with: { workExperience: { limit: 1 } },
  });
  return profile != null && profile.workExperience.length > 0;
}

export async function createProfile(data: { name: string; email: string }) {
  const db = await getDb();
  const [profile] = await db
    .insert(userProfiles)
    .values({
      tenantId: sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`,
      ...data,
    })
    .returning();
  return profile;
}

// WorkExperience mutations

export type WorkExperienceCreateData = {
  company: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  location: string | null;
  bullets: string[];
};

export type WorkExperienceUpdateData = Partial<WorkExperienceCreateData>;

export async function createWorkExperience(data: WorkExperienceCreateData) {
  const db = await getDb();
  const tenantSubq = sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`;
  const profileSubq = sql`(SELECT id FROM user_profiles WHERE tenant_id = ${tenantSubq})`;
  const [entry] = await db
    .insert(workExperience)
    .values({
      tenantId: tenantSubq,
      profileId: profileSubq,
      ...data,
    })
    .returning();
  return entry;
}

export async function updateWorkExperience(
  id: string,
  data: WorkExperienceUpdateData
) {
  const db = await getDb();
  const [entry] = await db
    .update(workExperience)
    .set(data)
    .where(eq(workExperience.id, id))
    .returning();
  return entry;
}

export async function deleteWorkExperience(id: string) {
  const db = await getDb();
  await db.delete(workExperience).where(eq(workExperience.id, id));
}

// Education mutations

export type EducationCreateData = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
};

export type EducationUpdateData = Partial<EducationCreateData>;

export async function createEducation(data: EducationCreateData) {
  const db = await getDb();
  const tenantSubq = sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`;
  const profileSubq = sql`(SELECT id FROM user_profiles WHERE tenant_id = ${tenantSubq})`;
  const [entry] = await db
    .insert(education)
    .values({
      tenantId: tenantSubq,
      profileId: profileSubq,
      ...data,
    })
    .returning();
  return entry;
}

export async function updateEducation(id: string, data: EducationUpdateData) {
  const db = await getDb();
  const [entry] = await db
    .update(education)
    .set(data)
    .where(eq(education.id, id))
    .returning();
  return entry;
}

export async function deleteEducation(id: string) {
  const db = await getDb();
  await db.delete(education).where(eq(education.id, id));
}

// SkillCategory mutations

export type SkillCategoryCreateData = {
  name: string;
  skills: string[];
};

export type SkillCategoryUpdateData = Partial<SkillCategoryCreateData>;

export async function createSkillCategory(data: SkillCategoryCreateData) {
  const db = await getDb();
  const tenantSubq = sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`;
  const profileSubq = sql`(SELECT id FROM user_profiles WHERE tenant_id = ${tenantSubq})`;
  const [entry] = await db
    .insert(skillCategories)
    .values({
      tenantId: tenantSubq,
      profileId: profileSubq,
      ...data,
    })
    .returning();
  return entry;
}

export async function updateSkillCategory(
  id: string,
  data: SkillCategoryUpdateData
) {
  const db = await getDb();
  const [entry] = await db
    .update(skillCategories)
    .set(data)
    .where(eq(skillCategories.id, id))
    .returning();
  return entry;
}

export async function deleteSkillCategory(id: string) {
  const db = await getDb();
  await db.delete(skillCategories).where(eq(skillCategories.id, id));
}
