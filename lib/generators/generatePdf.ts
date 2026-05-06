import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import type { ResumeJSON, Section, SectionType, Entry } from "@/lib/validators/resumeJson.schema";
import { extractEntryRenderData } from "@/lib/utils/entryRenderData";

const SIDEBAR_TYPES = new Set(["skills", "languages", "certifications"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EntryRows(entry: Entry, sectionType: SectionType, styles: any): React.ReactElement[] {
  const data = extractEntryRenderData(entry, sectionType);
  const rows: React.ReactElement[] = [];

  if (data.kind === "language") {
    rows.push(
      React.createElement(
        View,
        { key: "lang", style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 } },
        React.createElement(Text, { style: styles.line }, data.label),
        data.proficiency
          ? React.createElement(Text, { style: styles.contact }, data.proficiency)
          : null
      )
    );
    return rows;
  }

  if (data.kind === "skill") {
    rows.push(
      React.createElement(
        View,
        { key: "skill", style: { flexDirection: "row", marginBottom: 2, flexWrap: "wrap" } },
        data.label
          ? React.createElement(Text, { style: styles.bold }, `${data.label}: `)
          : null,
        React.createElement(Text, { style: styles.line }, data.value)
      )
    );
    return rows;
  }

  // Default: experience / education / projects / certifications / other
  const hasHeader = data.heading || data.subheading || data.date;
  if (hasHeader) {
    rows.push(
      React.createElement(
        View,
        { key: "header", style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 } },
        React.createElement(
          View,
          { style: { flex: 1 } },
          data.heading
            ? React.createElement(Text, { style: styles.bold }, data.heading)
            : null,
          data.subheading
            ? React.createElement(Text, { style: styles.line }, data.subheading)
            : null
        ),
        data.date
          ? React.createElement(Text, { style: styles.contact }, data.date)
          : null
      )
    );
  }

  if (data.body) {
    rows.push(React.createElement(Text, { key: "body", style: styles.line }, data.body));
  }

  data.bullets.forEach((bullet, i) => {
    rows.push(
      React.createElement(
        View,
        { key: `b${i}`, style: styles.bullet },
        React.createElement(Text, { style: styles.bulletDot }, "•  "),
        React.createElement(Text, { style: styles.bulletText }, bullet)
      )
    );
  });

  return rows;
}

// ─── Classic ─────────────────────────────────────────────────────────────────

function buildClassicStyles() {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 48,
      fontFamily: "Helvetica",
      fontSize: 10,
      lineHeight: 1.4,
      color: "#111111",
    },
    name: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
    contact: { fontSize: 9, textAlign: "center", color: "#444444", marginBottom: 2 },
    headerBlock: { marginBottom: 10 },
    sectionHeader: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      marginTop: 10,
      marginBottom: 4,
      paddingBottom: 2,
    },
    line: { fontSize: 10, marginBottom: 2 },
    bold: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 1 },
    bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 10 },
    bulletDot: { width: 10, fontSize: 10 },
    bulletText: { flex: 1, fontSize: 10 },
  });
}

export async function generateClassicPdf(resume: ResumeJSON): Promise<Buffer> {
  const styles = buildClassicStyles();

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER" as const, style: styles.page },
      React.createElement(
        View,
        { style: styles.headerBlock },
        React.createElement(Text, { style: styles.name }, resume.name),
        ...resume.contact.map((c, i) =>
          React.createElement(Text, { key: i, style: styles.contact }, c)
        )
      ),
      resume.summary
        ? React.createElement(Text, { style: { ...styles.line, marginBottom: 8 } }, resume.summary)
        : null,
      ...resume.sections.flatMap((section) => [
        React.createElement(
          Text,
          { key: `s${section.title}`, style: styles.sectionHeader },
          section.title.toUpperCase()
        ),
        ...section.entries.flatMap((entry, j) =>
          EntryRows(entry, section.type, styles).map((el, k) =>
            React.cloneElement(el, { key: `${section.title}-${j}-${k}` })
          )
        ),
      ])
    )
  );

  return Buffer.from(await renderToBuffer(doc));
}

// ─── Modern ──────────────────────────────────────────────────────────────────

const MODERN_ACCENT = "#2563EB";

function buildModernStyles() {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 50,
      fontFamily: "Helvetica",
      fontSize: 10,
      lineHeight: 1.5,
      color: "#1a1a1a",
    },
    name: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 3, color: "#111111" },
    contact: { fontSize: 9, textAlign: "center", color: "#555555", marginBottom: 2 },
    headerBlock: { marginBottom: 12 },
    sectionHeader: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      color: MODERN_ACCENT,
      borderBottomWidth: 1,
      borderBottomColor: MODERN_ACCENT,
      marginTop: 12,
      marginBottom: 5,
      paddingBottom: 2,
    },
    line: { fontSize: 10, marginBottom: 2, color: "#1a1a1a" },
    bold: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 1, color: "#1a1a1a" },
    bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 10 },
    bulletDot: { width: 10, fontSize: 10, color: MODERN_ACCENT },
    bulletText: { flex: 1, fontSize: 10 },
  });
}

export async function generateModernPdf(resume: ResumeJSON): Promise<Buffer> {
  const styles = buildModernStyles();

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER" as const, style: styles.page },
      React.createElement(
        View,
        { style: styles.headerBlock },
        React.createElement(Text, { style: styles.name }, resume.name),
        ...resume.contact.map((c, i) =>
          React.createElement(Text, { key: i, style: styles.contact }, c)
        )
      ),
      resume.summary
        ? React.createElement(Text, { style: { ...styles.line, marginBottom: 10, color: "#444444" } }, resume.summary)
        : null,
      ...resume.sections.flatMap((section) => [
        React.createElement(
          Text,
          { key: `s${section.title}`, style: styles.sectionHeader },
          section.title.toUpperCase()
        ),
        ...section.entries.flatMap((entry, j) =>
          EntryRows(entry, section.type, styles).map((el, k) =>
            React.cloneElement(el, { key: `${section.title}-${j}-${k}` })
          )
        ),
      ])
    )
  );

  return Buffer.from(await renderToBuffer(doc));
}

// ─── Two-Column ───────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 160;
const SIDEBAR_BG = "#f4f4f5";

function buildTwoColumnStyles() {
  return StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingHorizontal: 0,
      fontFamily: "Helvetica",
      fontSize: 10,
      lineHeight: 1.4,
      color: "#111111",
      flexDirection: "row",
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      backgroundColor: SIDEBAR_BG,
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 16,
    },
    main: {
      flex: 1,
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 28,
    },
    name: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 3 },
    contact: { fontSize: 8, color: "#555555", marginBottom: 2 },
    headerBlock: { marginBottom: 12 },
    sectionHeader: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      marginTop: 10,
      marginBottom: 4,
      paddingBottom: 2,
    },
    line: { fontSize: 9, marginBottom: 2 },
    bold: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 1 },
    bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
    bulletDot: { width: 8, fontSize: 9 },
    bulletText: { flex: 1, fontSize: 9 },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSections(sections: Section[], styles: any): React.ReactElement[] {
  return sections.flatMap((section) => [
    React.createElement(
      Text,
      { key: `s${section.title}`, style: styles.sectionHeader },
      section.title.toUpperCase()
    ),
    ...section.entries.flatMap((entry, j) =>
      EntryRows(entry, section.type, styles).map((el, k) =>
        React.cloneElement(el, { key: `${section.title}-${j}-${k}` })
      )
    ),
  ]);
}

export async function generateTwoColumnPdf(resume: ResumeJSON): Promise<Buffer> {
  const styles = buildTwoColumnStyles();

  const sidebarSections = resume.sections.filter((s) => SIDEBAR_TYPES.has(s.type));
  const mainSections = resume.sections.filter((s) => !SIDEBAR_TYPES.has(s.type));

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER" as const, style: styles.page },
      React.createElement(
        View,
        { style: styles.sidebar },
        React.createElement(
          View,
          { style: styles.headerBlock },
          React.createElement(Text, { style: styles.name }, resume.name),
          ...resume.contact.map((c, i) =>
            React.createElement(Text, { key: i, style: styles.contact }, c)
          )
        ),
        ...renderSections(sidebarSections, styles)
      ),
      React.createElement(
        View,
        { style: styles.main },
        resume.summary
          ? React.createElement(Text, { style: { ...styles.line, marginBottom: 10, color: "#444444" } }, resume.summary)
          : null,
        ...renderSections(mainSections, styles)
      )
    )
  );

  return Buffer.from(await renderToBuffer(doc));
}
