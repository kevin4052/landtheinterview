import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSkillCategory } from "@/lib/db/profile";

const SkillCategorySchema = z.object({
  name: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SkillCategorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const entry = await createSkillCategory(parsed.data);
    return Response.json(entry);
  } catch (err) {
    console.error("[skill-categories] create failed:", err);
    return Response.json({ error: "Failed to create skill category" }, { status: 500 });
  }
}
