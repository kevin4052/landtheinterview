import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { updateSkillCategory, deleteSkillCategory } from "@/lib/db/profile";

const SkillCategoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  skills: z.array(z.string().min(1)).min(1).optional(),
});

async function verifyOwnership(id: string, userId: string) {
  return prisma.skillCategory.findFirst({
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

  const parsed = SkillCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const { name, skills } = parsed.data;
    const updated = await updateSkillCategory(id, {
      ...(name !== undefined ? { name } : {}),
      ...(skills !== undefined ? { skills } : {}),
    });
    return Response.json(updated);
  } catch (err) {
    console.error("[skill-categories] update failed:", err);
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
    await deleteSkillCategory(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[skill-categories] delete failed:", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
