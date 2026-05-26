import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createEducation } from "@/lib/db/profile";
import { parseMonthDate } from "@/lib/utils/date";

const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
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

  const parsed = EducationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const { school, degree, fieldOfStudy, startDate, endDate, isCurrent } = parsed.data;

  try {
    const entry = await createEducation({
      school,
      degree,
      fieldOfStudy,
      startDate: parseMonthDate(startDate),
      endDate: endDate ? parseMonthDate(endDate) : null,
      isCurrent,
    });
    return Response.json(entry);
  } catch (err) {
    console.error("[education] create failed:", err);
    return Response.json({ error: "Failed to create education" }, { status: 500 });
  }
}
