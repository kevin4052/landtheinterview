import { z } from "zod";
import { ResumeJSONSchema } from "@/lib/validators/resumeJson.schema";
import { generateResumeFile } from "@/lib/generators/resumeFile";

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
    const file = await generateResumeFile(resume, { format, template });
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
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
