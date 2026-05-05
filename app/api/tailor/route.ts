import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { tailorResume } from "@/lib/ai/tailorResume";
import { TailorRequestSchema } from "@/lib/validators/tailor.schema";
import { assembleTailoredResumeTitle } from "@/lib/utils/assembleTailoredResumeTitle";

export async function POST(request: Request) {
  const { userId } = await auth();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Resume and job posting text are required" },
      { status: 400 }
    );
  }

  const { resumeText, jobText, inputFilename, inputFormat } = parsed.data;

  try {
    const tailorOutput = await tailorResume(resumeText, jobText);
    const { resume: resumeJson, jobTitle, companyName } = tailorOutput;

    after(async () => {
      try {
        const createdAt = new Date();
        const title = assembleTailoredResumeTitle(jobTitle, companyName, createdAt);
        await prisma.tailoredResume.create({
          data: {
            clerkUserId: userId ?? null,
            resumeText,
            jobText,
            outputText: JSON.stringify(resumeJson),
            inputFilename: inputFilename ?? null,
            inputFormat: inputFormat ?? "paste",
            title,
          },
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
