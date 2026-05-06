import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createWorkExperience } from "@/lib/db/profile";

const WorkExpSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  bullets: z.array(z.string()),
});

function parseMonthDate(s: string): Date {
  return new Date(s.length === 7 ? s + "-01" : s);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = WorkExpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const { company, title, startDate, endDate, isCurrent, location, bullets } = parsed.data;

  try {
    const entry = await createWorkExperience(userId, {
      company,
      title,
      startDate: parseMonthDate(startDate),
      endDate: endDate ? parseMonthDate(endDate) : null,
      isCurrent,
      location: location || null,
      bullets: bullets.filter(Boolean),
    });
    return Response.json(entry);
  } catch (err) {
    console.error("[work-experience] create failed:", err);
    return Response.json({ error: "Failed to create work experience" }, { status: 500 });
  }
}
