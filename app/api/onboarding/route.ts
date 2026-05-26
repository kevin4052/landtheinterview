import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profileIsComplete } from "@/lib/db/profile";
import {
  userProfiles,
  workExperience as workExperienceTable,
  education as educationTable,
  skillCategories as skillCategoriesTable,
} from "@/lib/db/schema";
import { parseMonthDate } from "@/lib/utils/date";

const WorkExpSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  bullets: z.array(z.string().min(1)),
});

const SkillCatSchema = z.object({
  categoryName: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

const OnboardingBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  workExperience: z.array(WorkExpSchema).min(1),
  skillCategories: z.array(SkillCatSchema),
  education: z.array(EducationSchema),
});


export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const alreadyComplete = await profileIsComplete();
  if (alreadyComplete) {
    return Response.json({ error: "Profile already complete" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OnboardingBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const {
    name,
    email,
    workExperience: workExp,
    skillCategories: skillCats,
    education: edu,
  } = parsed.data;

  try {
    const db = await getDb();

    await db.transaction(async (tx) => {
      // tenant_id resolved via Neon Auth (auth.user_id() reads the Clerk JWT)
      const [profile] = await tx
        .insert(userProfiles)
        .values({
          tenantId: sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`,
          name,
          email,
        })
        .returning({ id: userProfiles.id, tenantId: userProfiles.tenantId });

      await Promise.all([
        ...workExp.map((exp) =>
          tx.insert(workExperienceTable).values({
            tenantId: profile.tenantId,
            profileId: profile.id,
            company: exp.company,
            title: exp.title,
            startDate: parseMonthDate(exp.startDate),
            endDate: exp.endDate ? parseMonthDate(exp.endDate) : null,
            isCurrent: exp.isCurrent,
            location: exp.location || null,
            bullets: exp.bullets,
          })
        ),
        ...skillCats.map((cat) =>
          tx.insert(skillCategoriesTable).values({
            tenantId: profile.tenantId,
            profileId: profile.id,
            name: cat.categoryName,
            skills: cat.skills,
          })
        ),
        ...edu.map((e) =>
          tx.insert(educationTable).values({
            tenantId: profile.tenantId,
            profileId: profile.id,
            school: e.school,
            degree: e.degree,
            fieldOfStudy: e.fieldOfStudy,
            startDate: parseMonthDate(e.startDate),
            endDate: e.endDate ? parseMonthDate(e.endDate) : null,
            isCurrent: e.isCurrent ?? false,
          })
        ),
      ]);
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[onboarding] failed:", err);
    return Response.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
