import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const QuerySchema = z.object({
  format: z.enum(["pdf", "docx"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ format: searchParams.get("format") });
  if (!parsed.success) {
    return Response.json({ error: "format must be pdf or docx" }, { status: 400 });
  }

  const resume = await prisma.tailoredResume.findUnique({
    where: { id },
    select: { outputText: true, clerkUserId: true },
  });

  if (!resume) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (resume.clerkUserId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { format } = parsed.data;

  try {
    if (format === "docx") {
      const { generateDocx } = await import("@/lib/generators/generateDocx");
      const buffer = await generateDocx(resume.outputText);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="tailored-resume.docx"',
        },
      });
    }

    const { generatePdf } = await import("@/lib/generators/generatePdf");
    const buffer = await generatePdf(resume.outputText);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="tailored-resume.pdf"',
      },
    });
  } catch (err) {
    console.error("[resumes/download] Generation failed:", err);
    return Response.json(
      { error: "Failed to generate file. Please try again." },
      { status: 500 }
    );
  }
}
