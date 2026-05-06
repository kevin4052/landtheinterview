import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { updateWorkExperience, deleteWorkExperience } from "@/lib/db/profile";
import { parseMonthDate } from "@/lib/utils/date";

const WorkExpUpdateSchema = z.object({
  company: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().optional(),
  location: z.string().nullable().optional(),
  bullets: z.array(z.string().min(1)).optional(),
});

async function verifyOwnership(id: string, userId: string) {
  return prisma.workExperience.findFirst({
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

  const parsed = WorkExpUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const { startDate, endDate, bullets, ...rest } = parsed.data;

  try {
    const updated = await updateWorkExperience(id, {
      ...rest,
      ...(startDate !== undefined ? { startDate: parseMonthDate(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? parseMonthDate(endDate) : null } : {}),
      ...(bullets !== undefined ? { bullets } : {}),
    });
    return Response.json(updated);
  } catch (err) {
    console.error("[work-experience] update failed:", err);
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
    await deleteWorkExperience(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[work-experience] delete failed:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
