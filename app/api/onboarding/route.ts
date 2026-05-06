import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { profileIsComplete } from "@/lib/db/profile";

const WorkExpSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  bullets: z.array(z.string()),
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

function parseMonthDate(s: string): Date {
  return new Date(s.length === 7 ? s + "-01" : s);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const alreadyComplete = await profileIsComplete(userId);
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

  const { name, email, workExperience, skillCategories, education } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.create({
        data: { clerkUserId: userId, name, email },
      });

      await Promise.all([
        ...workExperience.map((exp) =>
          tx.workExperience.create({
            data: {
              profileId: profile.id,
              company: exp.company,
              title: exp.title,
              startDate: parseMonthDate(exp.startDate),
              endDate: exp.endDate ? parseMonthDate(exp.endDate) : null,
              isCurrent: exp.isCurrent,
              location: exp.location || null,
              bullets: exp.bullets.filter(Boolean),
            },
          })
        ),
        ...skillCategories.map((cat) =>
          tx.skillCategory.create({
            data: {
              profileId: profile.id,
              name: cat.categoryName,
              skills: cat.skills,
            },
          })
        ),
        ...education.map((edu) =>
          tx.education.create({
            data: {
              profileId: profile.id,
              school: edu.school,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: parseMonthDate(edu.startDate),
              endDate: edu.endDate ? parseMonthDate(edu.endDate) : null,
              isCurrent: edu.isCurrent ?? false,
            },
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
