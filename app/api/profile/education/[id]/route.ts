import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { education } from "@/lib/db/schema";
import { updateEducation, deleteEducation } from "@/lib/db/profile";
import { parseMonthDate } from "@/lib/utils/date";

const EducationUpdateSchema = z.object({
  school: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  fieldOfStudy: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().optional(),
});

async function verifyOwnership(id: string) {
  const db = await getDb();
  const [entry] = await db
    .select({ id: education.id })
    .from(education)
    .where(eq(education.id, id))
    .limit(1);
  return entry ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const entry = await verifyOwnership(id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EducationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const { startDate, endDate, ...rest } = parsed.data;

  try {
    const updated = await updateEducation(id, {
      ...rest,
      ...(startDate !== undefined ? { startDate: parseMonthDate(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? parseMonthDate(endDate) : null } : {}),
    });
    return Response.json(updated);
  } catch (err) {
    console.error("[education] update failed:", err);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const entry = await verifyOwnership(id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteEducation(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[education] delete failed:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
