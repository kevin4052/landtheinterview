import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ResumeJSONSchema } from "@/lib/validators/resumeJson.schema";
import { getTailorLogById } from "@/lib/db/tailor-log";

const QuerySchema = z.object({
  format: z.enum(["pdf", "docx"]),
  template: z.enum(["classic", "modern", "two-column"]).optional().default("classic"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    format: searchParams.get("format"),
    template: searchParams.get("template") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "format must be pdf or docx" }, { status: 400 });
  }

  const log = await getTailorLogById(userId, id);
  if (!log) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const resumeParsed = ResumeJSONSchema.safeParse(JSON.parse(log.outputText));
  if (!resumeParsed.success) {
    return Response.json({ error: "Stored resume data is invalid" }, { status: 500 });
  }

  const resume = resumeParsed.data;
  const { format, template } = parsed.data;

  try {
    if (format === "docx") {
      const { generateDocx } = await import("@/lib/generators/generateDocx");
      const buffer = await generateDocx(resume, template);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="tailored-resume.docx"',
        },
      });
    }

    const { generateClassicPdf, generateModernPdf, generateTwoColumnPdf } =
      await import("@/lib/generators/generatePdf");

    const generator =
      template === "modern"
        ? generateModernPdf
        : template === "two-column"
          ? generateTwoColumnPdf
          : generateClassicPdf;

    const buffer = await generator(resume);
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
