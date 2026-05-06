import { z } from "zod";
import { ResumeJSONSchema } from "@/lib/validators/resumeJson.schema";

const DownloadRequestSchema = z.object({
  resume: ResumeJSONSchema,
  format: z.enum(["pdf", "docx"]),
  template: z.enum(["classic", "modern", "two-column"]).optional().default("classic"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = DownloadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "resume (ResumeJSON), format (pdf|docx), and optional template are required" },
      { status: 400 }
    );
  }

  const { resume, format, template } = parsed.data;

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
    console.error("[download] Generation failed:", err);
    return Response.json(
      { error: "Failed to generate file. Please try again." },
      { status: 500 }
    );
  }
}
