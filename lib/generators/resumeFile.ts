import "server-only";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

export type ResumeFileFormat = "pdf" | "docx";
export type ResumeTemplate = "classic" | "modern" | "two-column";

export type ResumeFile = {
  body: Uint8Array<ArrayBuffer>;
  contentType: string;
  filename: string;
};

export async function generateResumeFile(
  resume: ResumeJSON,
  opts: { format: ResumeFileFormat; template: ResumeTemplate }
): Promise<ResumeFile> {
  const { format, template } = opts;

  if (format === "docx") {
    const { generateDocx } = await import("./generateDocx");
    const buffer = await generateDocx(resume, template);
    return {
      body: new Uint8Array(buffer),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: "tailored-resume.docx",
    };
  }

  const { generatePdf } = await import("./generatePdf");
  const buffer = await generatePdf(resume, template);
  return {
    body: new Uint8Array(buffer),
    contentType: "application/pdf",
    filename: "tailored-resume.pdf",
  };
}
