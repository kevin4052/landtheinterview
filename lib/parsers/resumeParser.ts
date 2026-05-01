import mammoth from "mammoth";

export type ParsedResume = {
  text: string;
  filename: string;
  format: "pdf" | "docx" | "txt";
};

export async function parseResumeFile(
  file: File
): Promise<ParsedResume> {
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return { text: await file.text(), filename, format: "txt" };
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return { text: result.value, filename, format: "docx" };
  }

  if (ext === "pdf") {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return { text, filename, format: "pdf" };
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
