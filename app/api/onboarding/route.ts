import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureTenant, profileIsComplete } from "@/lib/db/profile";
import { parseMonthDate } from "@/lib/utils/date";
import { ContactLinksSchema, projectUrlSchema } from "@/lib/validators/contactLink.schema";

const MonthDateString = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(parseMonthDate(s).getTime()), "Invalid date");

const WorkExpSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: MonthDateString,
  endDate: MonthDateString.optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  bullets: z.array(z.string().min(1)),
});

const PersonalProjectSchema = z.object({
  title: z.string().min(1),
  url: projectUrlSchema.optional(),
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
  startDate: MonthDateString,
  endDate: MonthDateString.optional(),
  isCurrent: z.boolean().optional(),
});

const OnboardingBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().transform((v) => v.trim() || null).optional(),
  location: z.string().transform((v) => v.trim() || null).optional(),
  contactLinks: ContactLinksSchema.default([]),
  workExperience: z.array(WorkExpSchema).min(1),
  personalProjects: z.array(PersonalProjectSchema).default([]),
  skillCategories: z.array(SkillCatSchema),
  education: z.array(EducationSchema),
});


export async function POST(request: Request) {
  const { getToken, userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
    phone,
    location,
    contactLinks,
    workExperience: workExp,
    personalProjects: projects,
    skillCategories: skillCats,
    education: edu,
  } = parsed.data;

  try {
    const authToken = await getToken({ template: "neon_rls" });
    await ensureTenant(userId);

    const alreadyComplete = await profileIsComplete(authToken);
    if (alreadyComplete) {
      return Response.json({ error: "Profile already complete" }, { status: 409 });
    }

    const db = await getDb(authToken);

    const workExperienceJson = JSON.stringify(
      workExp.map((exp) => ({
        company: exp.company,
        title: exp.title,
        start_date: parseMonthDate(exp.startDate).toISOString(),
        end_date: exp.endDate ? parseMonthDate(exp.endDate).toISOString() : null,
        is_current: exp.isCurrent,
        location: exp.location || null,
        bullets: exp.bullets,
      }))
    );
    const skillCategoriesJson = JSON.stringify(
      skillCats.map((cat) => ({
        name: cat.categoryName,
        skills: cat.skills,
      }))
    );
    const contactLinksJson = JSON.stringify(contactLinks);
    const personalProjectsJson = JSON.stringify(
      projects.map((p) => ({
        title: p.title,
        url: p.url ?? null,
        bullets: p.bullets,
      }))
    );
    const educationJson = JSON.stringify(
      edu.map((e) => ({
        school: e.school,
        degree: e.degree,
        field_of_study: e.fieldOfStudy,
        start_date: parseMonthDate(e.startDate).toISOString(),
        end_date: e.endDate ? parseMonthDate(e.endDate).toISOString() : null,
        is_current: e.isCurrent ?? false,
      }))
    );

    await db.execute(sql`
      WITH tenant AS (
        SELECT (
          SELECT id FROM tenants WHERE clerk_user_id = auth.user_id()
        ) AS id
      ),
      inserted_profile AS (
        INSERT INTO user_profiles (tenant_id, name, email, phone, location, contact_links)
        SELECT id, ${name}, ${email}, ${phone ?? null}, ${location ?? null}, ${contactLinksJson}::jsonb
        FROM tenant
        RETURNING id, tenant_id
      ),
      inserted_work_experience AS (
        INSERT INTO work_experience (
          tenant_id,
          profile_id,
          company,
          title,
          start_date,
          end_date,
          is_current,
          location,
          bullets
        )
        SELECT
          profile.tenant_id,
          profile.id,
          item.company,
          item.title,
          item.start_date::timestamptz,
          item.end_date::timestamptz,
          item.is_current,
          item.location,
          ARRAY(SELECT jsonb_array_elements_text(item.bullets))
        FROM inserted_profile profile
        CROSS JOIN jsonb_to_recordset(${workExperienceJson}::jsonb) AS item(
          company text,
          title text,
          start_date text,
          end_date text,
          is_current boolean,
          location text,
          bullets jsonb
        )
      ),
      inserted_personal_projects AS (
        INSERT INTO personal_projects (tenant_id, profile_id, title, url, bullets, created_at)
        SELECT
          profile.tenant_id,
          profile.id,
          item.value->>'title',
          item.value->>'url',
          ARRAY(SELECT jsonb_array_elements_text(item.value->'bullets')),
          -- now() is constant across the statement; stagger created_at by array
          -- position so Personal Projects keep their creation order.
          now() + (item.ordinality * interval '1 millisecond')
        FROM inserted_profile profile
        CROSS JOIN jsonb_array_elements(${personalProjectsJson}::jsonb)
          WITH ORDINALITY AS item(value, ordinality)
      ),
      inserted_skill_categories AS (
        INSERT INTO skill_categories (tenant_id, profile_id, name, skills)
        SELECT
          profile.tenant_id,
          profile.id,
          item.name,
          ARRAY(SELECT jsonb_array_elements_text(item.skills))
        FROM inserted_profile profile
        CROSS JOIN jsonb_to_recordset(${skillCategoriesJson}::jsonb) AS item(
          name text,
          skills jsonb
        )
      )
      INSERT INTO education (
        tenant_id,
        profile_id,
        school,
        degree,
        field_of_study,
        start_date,
        end_date,
        is_current
      )
      SELECT
        profile.tenant_id,
        profile.id,
        item.school,
        item.degree,
        item.field_of_study,
        item.start_date::timestamptz,
        item.end_date::timestamptz,
        item.is_current
      FROM inserted_profile profile
      CROSS JOIN jsonb_to_recordset(${educationJson}::jsonb) AS item(
        school text,
        degree text,
        field_of_study text,
        start_date text,
        end_date text,
        is_current boolean
      )
    `);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[onboarding] failed:", err);
    return Response.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
