import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const UpdateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const updated = await prisma.userProfile.update({
      where: { clerkUserId: userId },
      data: parsed.data,
      select: { id: true, name: true, email: true },
    });
    return Response.json(updated);
  } catch (err) {
    console.error("[profile] update failed:", err);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
