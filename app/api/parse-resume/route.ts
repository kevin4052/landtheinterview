import { parseResumeFile } from "@/lib/parsers/resumeParser";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — Vercel serverless limit

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 4MB." },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
    return Response.json(
      { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
      { status: 400 }
    );
  }

  try {
    const parsed = await parseResumeFile(file);
    return Response.json({
      text: parsed.text,
      filename: parsed.filename,
      format: parsed.format,
    });
  } catch (err) {
    console.error("[parse-resume] Parsing failed:", err);
    return Response.json(
      { error: "Failed to parse file. Please check the file and try again." },
      { status: 422 }
    );
  }
}
