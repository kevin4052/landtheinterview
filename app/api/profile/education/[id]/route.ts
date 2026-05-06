import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { updateEducation, deleteEducation } from "@/lib/db/profile";

const EducationUpdateSchema = z.object({
  school: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  fieldOfStudy: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().optional(),
});

function parseMonthDate(s: string): Date {
  return new Date(s.length === 7 ? s + "-01" : s);
}

async function verifyOwnership(id: string, userId: string) {
  return prisma.education.findFirst({
    where: { id, profile: { clerkUserId: userId } },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const entry = await verifyOwnership(id, userId);
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

  const entry = await verifyOwnership(id, userId);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteEducation(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[education] delete failed:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
