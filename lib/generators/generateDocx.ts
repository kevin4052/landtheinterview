import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TabStopType,
  ShadingType,
  convertInchesToTwip,
} from "docx";
import type { ResumeJSON, Entry, SectionType } from "@/lib/validators/resumeJson.schema";
import { extractEntryRenderData } from "@/lib/utils/entryRenderData";

const SIDEBAR_TYPES = new Set(["skills", "languages", "certifications"]);

// Right-margin tab stop position (twips, letter page with standard margins)
const RIGHT_TAB = 9026;

type DocxConfig = {
  font: string;
  bodySize: number;
  nameSize: number;
  accentColor: string;
};

const CLASSIC: DocxConfig = {
  font: "Calibri",
  bodySize: 20,
  nameSize: 32,
  accentColor: "000000",
};

const MODERN: DocxConfig = {
  font: "Calibri",
  bodySize: 20,
  nameSize: 32,
  accentColor: "2563EB",
};

const TWO_COLUMN: DocxConfig = {
  font: "Calibri",
  bodySize: 18,
  nameSize: 28,
  accentColor: "000000",
};

function sectionHeader(title: string, cfg: DocxConfig): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: cfg.bodySize + 2,
        font: cfg.font,
        color: cfg.accentColor,
      }),
    ],
    spacing: { before: 200, after: 60 },
    border: {
      bottom: {
        color: cfg.accentColor,
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  });
}

function entryParagraphs(entry: Entry, sectionType: SectionType, cfg: DocxConfig): Paragraph[] {
  const data = extractEntryRenderData(entry, sectionType);

  if (data.kind === "language") {
    return [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        children: [
          new TextRun({ text: data.label, size: cfg.bodySize, font: cfg.font }),
          ...(data.proficiency
            ? [new TextRun({ text: `\t${data.proficiency}`, size: cfg.bodySize, font: cfg.font, color: "666666" })]
            : []),
        ],
        spacing: { after: 40 },
      }),
    ];
  }

  if (data.kind === "skill") {
    return [
      new Paragraph({
        children: [
          ...(data.label
            ? [new TextRun({ text: `${data.label}: `, bold: true, size: cfg.bodySize, font: cfg.font })]
            : []),
          new TextRun({ text: data.value, size: cfg.bodySize, font: cfg.font }),
        ],
        spacing: { after: 40 },
      }),
    ];
  }

  const paragraphs: Paragraph[] = [];

  if (data.heading || data.subheading || data.date) {
    paragraphs.push(
      new Paragraph({
        tabStops: data.date ? [{ type: TabStopType.RIGHT, position: RIGHT_TAB }] : [],
        children: [
          ...(data.heading
            ? [new TextRun({ text: data.heading, bold: true, size: cfg.bodySize, font: cfg.font })]
            : []),
          ...(data.subheading
            ? [new TextRun({ text: `  ${data.subheading}`, size: cfg.bodySize, font: cfg.font, color: "555555" })]
            : []),
          ...(data.date
            ? [new TextRun({ text: `\t${data.date}`, size: cfg.bodySize - 2, font: cfg.font, color: "888888" })]
            : []),
        ],
        spacing: { after: 20 },
      })
    );
  }

  if (data.body) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: data.body, size: cfg.bodySize, font: cfg.font })],
        spacing: { after: 20 },
      })
    );
  }

  for (const bullet of data.bullets) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: bullet, size: cfg.bodySize, font: cfg.font })],
        bullet: { level: 0 },
        spacing: { after: 40 },
        indent: { left: convertInchesToTwip(0.25) },
      })
    );
  }

  return paragraphs;
}

function headerParagraphs(resume: ResumeJSON, cfg: DocxConfig, centered = true): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: resume.name, bold: true, size: cfg.nameSize, font: cfg.font })],
      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 60 },
    }),
    ...resume.contact.map(
      (c) =>
        new Paragraph({
          children: [new TextRun({ text: c, size: cfg.bodySize - 2, font: cfg.font, color: "555555" })],
          alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { after: 40 },
        })
    ),
  ];
}

function sectionParagraphs(resume: ResumeJSON, cfg: DocxConfig, filter?: (type: string) => boolean): Paragraph[] {
  const sections = filter ? resume.sections.filter((s) => filter(s.type)) : resume.sections;
  return sections.flatMap((section) => [
    sectionHeader(section.title, cfg),
    ...section.entries.flatMap((entry) => entryParagraphs(entry, section.type, cfg)),
  ]);
}

function buildFlatDocument(resume: ResumeJSON, cfg: DocxConfig): Paragraph[] {
  return [
    ...headerParagraphs(resume, cfg),
    ...(resume.summary
      ? [
          new Paragraph({
            children: [new TextRun({ text: resume.summary, size: cfg.bodySize, font: cfg.font, color: "444444" })],
            spacing: { after: 120 },
          }),
        ]
      : []),
    ...sectionParagraphs(resume, cfg),
  ];
}

function buildTwoColumnTable(resume: ResumeJSON): Table {
  const sidebarParagraphs: Paragraph[] = [
    ...headerParagraphs(resume, TWO_COLUMN, false),
    ...sectionParagraphs(resume, TWO_COLUMN, (t) => SIDEBAR_TYPES.has(t)),
  ];

  const mainParagraphs: Paragraph[] = [
    ...(resume.summary
      ? [
          new Paragraph({
            children: [new TextRun({ text: resume.summary, size: TWO_COLUMN.bodySize, font: TWO_COLUMN.font, color: "444444" })],
            spacing: { after: 120 },
          }),
        ]
      : []),
    ...sectionParagraphs(resume, TWO_COLUMN, (t) => !SIDEBAR_TYPES.has(t)),
  ];

  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "F4F4F5" },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            margins: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.15),
            },
            children: sidebarParagraphs,
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            margins: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.5),
            },
            children: mainParagraphs,
          }),
        ],
      }),
    ],
  });
}

export async function generateDocx(
  resume: ResumeJSON,
  template: "classic" | "modern" | "two-column"
): Promise<Buffer> {
  const isTwoColumn = template === "two-column";
  const cfg = template === "modern" ? MODERN : CLASSIC;

  const children = isTwoColumn
    ? [buildTwoColumnTable(resume)]
    : buildFlatDocument(resume, cfg);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(isTwoColumn ? 0 : 0.75),
              bottom: convertInchesToTwip(isTwoColumn ? 0 : 0.75),
              left: convertInchesToTwip(isTwoColumn ? 0 : 1),
              right: convertInchesToTwip(isTwoColumn ? 0 : 1),
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
