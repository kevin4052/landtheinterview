import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { updateTailorLogTitle } from "@/lib/db/tailor-log";

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

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await updateTailorLogTitle(userId, id, parsed.data.title);
  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(updated);
}
