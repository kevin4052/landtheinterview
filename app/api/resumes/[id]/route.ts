import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const PatchBodySchema = z.object({
  title: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const record = await prisma.tailoredResume.findUnique({
    where: { id },
    select: { clerkUserId: true },
  });

  if (!record) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!record.clerkUserId || record.clerkUserId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.tailoredResume.update({
    where: { id },
    data: { title: parsed.data.title },
    select: { id: true, title: true },
  });

  return Response.json(updated);
}
