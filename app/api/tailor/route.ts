import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runTailor } from "@/lib/tailor/runTailor";
import { createTailorLog } from "@/lib/db/tailor-log";
import { TailorRequestSchema } from "@/lib/validators/tailor.schema";
import { assembleTailoredResumeTitle } from "@/lib/utils/assembleTailoredResumeTitle";
import { getProfile } from "@/lib/db/profile";
import { consumeAllowance } from "@/lib/billing/allowance";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  if (!profile) {
    return Response.json(
      { error: "No profile found. Please complete your profile before tailoring a resume." },
      { status: 400 }
    );
  }

  const { allowed } = await consumeAllowance();
  if (!allowed) {
    return Response.json({ error: "allowance_exhausted" }, { status: 402 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Job posting text is required" },
      { status: 400 }
    );
  }

  try {
    const { resumeJson, resumeText, jobTitle, companyName } = await runTailor(
      profile,
      parsed.data.jobText
    );

    after(async () => {
      try {
        const createdAt = new Date();
        const title = assembleTailoredResumeTitle(jobTitle, companyName, createdAt);
        await createTailorLog({
          resumeText,
          jobText: parsed.data.jobText,
          outputText: JSON.stringify(resumeJson),
          title,
        });
      } catch (err) {
        console.error("[tailor] DB write failed:", err);
      }
    });

    return Response.json(resumeJson);
  } catch (err) {
    console.error("[tailor] AI call failed:", err);
    return Response.json(
      { error: "Failed to generate tailored resume. Please try again." },
      { status: 500 }
    );
  }
}
