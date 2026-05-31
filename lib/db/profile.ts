import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getAdminDb } from "@/lib/db/admin";
import {
  tenants,
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

// A profile is "complete" once it has at least one work experience. The
// clerkUserId filter is only needed for the admin connection; the RLS
// connection is already scoped to the caller's tenant.
async function hasCompleteProfile(
  db: ReturnType<typeof getAdminDb>,
  clerkUserId?: string
): Promise<boolean> {
  const rows = await db
    .select({ profileId: userProfiles.id })
    .from(tenants)
    .innerJoin(userProfiles, eq(userProfiles.tenantId, tenants.id))
    .innerJoin(workExperience, eq(workExperience.profileId, userProfiles.id))
    .where(clerkUserId ? eq(tenants.clerkUserId, clerkUserId) : undefined)
    .limit(1);
  return rows.length > 0;
}

export async function profileIsComplete(authToken?: string | null): Promise<boolean> {
  return hasCompleteProfile(await getDb(authToken));
}

export async function profileIsCompleteAdmin(clerkUserId: string): Promise<boolean> {
  return hasCompleteProfile(getAdminDb(), clerkUserId);
}

export async function ensureTenant(clerkUserId: string): Promise<void> {
  await getAdminDb()
    .insert(tenants)
    .values({
      clerkUserId,
      plan: "free",
      lifetimeOpsUsed: 0,
      monthlyOpsUsed: 0,
    })
    .onConflictDoNothing({ target: tenants.clerkUserId });
}

