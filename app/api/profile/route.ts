import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";

// Empty/whitespace input clears the field; omitting it leaves it unchanged.
const optionalText = z
  .string()
  .transform((v) => v.trim() || null)
  .nullable()
  .optional();

const UpdateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: optionalText,
  location: optionalText,
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
    const db = await getDb();
    // RLS on user_profiles ensures only the tenant's own profile is updated
    const [updated] = await db
      .update(userProfiles)
      .set(parsed.data)
      .returning({
        id: userProfiles.id,
        name: userProfiles.name,
        email: userProfiles.email,
        phone: userProfiles.phone,
        location: userProfiles.location,
      });
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(updated);
  } catch (err) {
    console.error("[profile] update failed:", err);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
