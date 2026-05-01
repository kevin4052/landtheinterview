import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from "docx";

function parseResumeLines(text: string) {
  return text.split("\n");
}

function isAllCaps(line: string) {
  const stripped = line.replace(/[^a-zA-Z]/g, "");
  return stripped.length > 2 && stripped === stripped.toUpperCase();
}

function isSectionHeader(line: string) {
  const trimmed = line.trim();
  return (
    isAllCaps(trimmed) ||
    /^#{1,3}\s/.test(trimmed) ||
    /^[A-Z][A-Za-z\s]+:?\s*$/.test(trimmed)
  );
}

function buildParagraph(line: string): Paragraph {
  const trimmed = line.trim();

  if (!trimmed) {
    return new Paragraph({ text: "", spacing: { after: 60 } });
  }

  if (isSectionHeader(trimmed)) {
    const text = trimmed.replace(/^#{1,3}\s/, "");
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 22,
          font: "Calibri",
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    });
  }

  if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
    return new Paragraph({
      children: [
        new TextRun({ text: trimmed.slice(2), size: 20, font: "Calibri" }),
      ],
      bullet: { level: 0 },
      spacing: { after: 60 },
      indent: { left: convertInchesToTwip(0.25) },
    });
  }

  return new Paragraph({
    children: [new TextRun({ text: trimmed, size: 20, font: "Calibri" })],
    spacing: { after: 60 },
  });
}

export async function generateDocx(resumeText: string): Promise<Buffer> {
  const lines = parseResumeLines(resumeText);
  const firstNonEmpty = lines.findIndex((l) => l.trim());
  const nameLines: string[] = [];
  const bodyLines: string[] = [];

  // First non-empty line(s) treated as name/contact header
  let headerDone = false;
  let blankAfterHeader = false;
  for (const line of lines) {
    if (!headerDone) {
      if (line.trim()) {
        nameLines.push(line.trim());
      } else if (nameLines.length > 0) {
        blankAfterHeader = true;
        headerDone = true;
      }
    } else {
      bodyLines.push(line);
    }
  }
  if (!headerDone) bodyLines.push(...nameLines.splice(1));

  const headerParagraphs = nameLines.map(
    (name, i) =>
      new Paragraph({
        children: [
          new TextRun({
            text: name,
            bold: i === 0,
            size: i === 0 ? 32 : 20,
            font: "Calibri",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: i === 0 ? 60 : 40 },
      })
  );

  const bodyParagraphs = bodyLines.map(buildParagraph);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [...headerParagraphs, ...bodyParagraphs],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
