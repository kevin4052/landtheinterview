import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#111111",
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    textAlign: "center",
    color: "#444444",
    marginBottom: 2,
  },
  headerBlock: {
    marginBottom: 10,
  },
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
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  line: {
    marginBottom: 2,
    fontSize: 10,
  },
});

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

function buildPageContent(text: string) {
  const lines = text.split("\n");
  const nameLines: string[] = [];
  const bodyLines: string[] = [];

  let headerDone = false;
  for (const line of lines) {
    if (!headerDone) {
      if (line.trim()) {
        nameLines.push(line.trim());
      } else if (nameLines.length > 0) {
        headerDone = true;
      }
    } else {
      bodyLines.push(line);
    }
  }
  if (!headerDone) bodyLines.push(...nameLines.splice(1));

  return { nameLines, bodyLines };
}

export async function generatePdf(resumeText: string): Promise<Buffer> {
  const { nameLines, bodyLines } = buildPageContent(resumeText);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER" as const, style: styles.page },
      React.createElement(
        View,
        { style: styles.headerBlock },
        nameLines[0]
          ? React.createElement(Text, { style: styles.name }, nameLines[0])
          : null,
        ...nameLines.slice(1).map((l, i) =>
          React.createElement(Text, { key: `h${i}`, style: styles.contact }, l)
        )
      ),
      ...bodyLines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return React.createElement(View, { key: i, style: { height: 4 } });
        }
        if (isSectionHeader(trimmed)) {
          return React.createElement(
            Text,
            { key: i, style: styles.sectionHeader },
            trimmed.replace(/^#{1,3}\s/, "").toUpperCase()
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return React.createElement(
            View,
            { key: i, style: styles.bullet },
            React.createElement(Text, { style: styles.bulletDot }, "•  "),
            React.createElement(
              Text,
              { style: styles.bulletText },
              trimmed.slice(2)
            )
          );
        }
        return React.createElement(Text, { key: i, style: styles.line }, trimmed);
      })
    )
  );

  return Buffer.from(await renderToBuffer(doc));
}
