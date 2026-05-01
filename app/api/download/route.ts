import { z } from "zod";

const DownloadRequestSchema = z.object({
  text: z.string().min(1),
  format: z.enum(["pdf", "docx"]),
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
    return Response.json({ error: "text and format (pdf|docx) are required" }, { status: 400 });
  }

  const { text, format } = parsed.data;

  try {
    if (format === "docx") {
      const { generateDocx } = await import("@/lib/generators/generateDocx");
      const buffer = await generateDocx(text);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="tailored-resume.docx"',
        },
      });
    }

    const { generatePdf } = await import("@/lib/generators/generatePdf");
    const buffer = await generatePdf(text);
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
