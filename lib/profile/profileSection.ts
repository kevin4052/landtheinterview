import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db/client";
import { workExperience, education, skillCategories } from "@/lib/db/schema";
import { parseMonthDate } from "@/lib/utils/date";

// Insert subqueries resolve the caller's Tenant and Profile from the JWT.
// RLS independently rejects any row that doesn't belong to the caller, so
// no application-level ownership check is needed.
const tenantSubq = sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`;
const profileSubq = sql`(SELECT id FROM user_profiles WHERE tenant_id = ${tenantSubq})`;

export type SectionResult =
  | { ok: true; entry: unknown }
  | { ok: false; reason: "invalid" | "empty" | "not_found" | "error" };

type IdTable = PgTable & { id: AnyPgColumn };

// Drizzle types every value to the concrete table; with a generic table and
// SQL-valued tenant/profile columns the call can't be statically checked, so
// values are cast. Runtime correctness comes from the Zod schema, not Drizzle.
function defineSection(
  table: IdTable,
  createSchema: z.ZodTypeAny,
  updateSchema: z.ZodTypeAny
) {
  return {
    async create(rawBody: unknown): Promise<SectionResult> {
      const parsed = createSchema.safeParse(rawBody);
      if (!parsed.success) return { ok: false, reason: "invalid" };
      try {
        const db = await getDb();
        const values = parsed.data as Record<string, unknown>;
        const [entry] = await db
          .insert(table)
          .values({ tenantId: tenantSubq, profileId: profileSubq, ...values } as never)
          .returning();
        return { ok: true, entry };
      } catch (err) {
        console.error("[profile-section] create failed:", err);
        return { ok: false, reason: "error" };
      }
    },

    async update(id: string, rawBody: unknown): Promise<SectionResult> {
      const parsed = updateSchema.safeParse(rawBody);
      if (!parsed.success) return { ok: false, reason: "invalid" };
      const values = parsed.data as Record<string, unknown>;
      if (Object.keys(values).length === 0) return { ok: false, reason: "empty" };
      try {
        const db = await getDb();
        const [entry] = await db
          .update(table)
          .set(values as never)
          .where(eq(table.id, id))
          .returning();
        return entry ? { ok: true, entry } : { ok: false, reason: "not_found" };
      } catch (err) {
        console.error("[profile-section] update failed:", err);
        return { ok: false, reason: "error" };
      }
    },

    async remove(id: string): Promise<SectionResult> {
      try {
        const db = await getDb();
        const [entry] = await db
          .delete(table)
          .where(eq(table.id, id))
          .returning({ id: table.id });
        return entry ? { ok: true, entry } : { ok: false, reason: "not_found" };
      } catch (err) {
        console.error("[profile-section] delete failed:", err);
        return { ok: false, reason: "error" };
      }
    },
  };
}

const SECTIONS = {
  "work-experience": defineSection(
    workExperience,
    z.object({
      company: z.string().min(1),
      title: z.string().min(1),
      startDate: z.string().min(1).transform(parseMonthDate),
      endDate: z.string().optional().transform((s) => (s ? parseMonthDate(s) : null)),
      isCurrent: z.boolean(),
      location: z.string().optional().transform((s) => s || null),
      bullets: z.array(z.string().min(1)),
    }),
    z.object({
      company: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      startDate: z.string().min(1).transform(parseMonthDate).optional(),
      endDate: z.string().nullable().transform((s) => (s ? parseMonthDate(s) : null)).optional(),
      isCurrent: z.boolean().optional(),
      location: z.string().nullable().transform((s) => s || null).optional(),
      bullets: z.array(z.string().min(1)).optional(),
    })
  ),

  education: defineSection(
    education,
    z.object({
      school: z.string().min(1),
      degree: z.string().min(1),
      fieldOfStudy: z.string().min(1),
      startDate: z.string().min(1).transform(parseMonthDate),
      endDate: z.string().optional().transform((s) => (s ? parseMonthDate(s) : null)),
      isCurrent: z.boolean(),
    }),
    z.object({
      school: z.string().min(1).optional(),
      degree: z.string().min(1).optional(),
      fieldOfStudy: z.string().min(1).optional(),
      startDate: z.string().min(1).transform(parseMonthDate).optional(),
      endDate: z.string().nullable().transform((s) => (s ? parseMonthDate(s) : null)).optional(),
      isCurrent: z.boolean().optional(),
    })
  ),

  "skill-categories": defineSection(
    skillCategories,
    z.object({
      name: z.string().min(1),
      skills: z.array(z.string().min(1)).min(1),
    }),
    z.object({
      name: z.string().min(1).optional(),
      skills: z.array(z.string().min(1)).min(1).optional(),
    })
  ),
} as const;

export type SectionKind = keyof typeof SECTIONS;

export function isSectionKind(value: string): value is SectionKind {
  return Object.prototype.hasOwnProperty.call(SECTIONS, value);
}

export function getSection(kind: SectionKind) {
  return SECTIONS[kind];
}

export function sectionResponse(result: SectionResult): Response {
  if (result.ok) return Response.json(result.entry ?? { ok: true });
  switch (result.reason) {
    case "invalid":
      return Response.json({ error: "Invalid data" }, { status: 400 });
    case "empty":
      return Response.json({ error: "No fields to update" }, { status: 400 });
    case "not_found":
      return Response.json({ error: "Not found" }, { status: 404 });
    case "error":
      return Response.json({ error: "Operation failed" }, { status: 500 });
  }
}
