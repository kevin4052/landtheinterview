"use client";

import { useState } from "react";
import { ResumePreview } from "@/app/components/ResumePreview";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

function toPlainText(resume: ResumeJSON): string {
  const lines: string[] = [resume.name, ...resume.contact, ""];
  if (resume.summary) lines.push(resume.summary, "");
  for (const section of resume.sections) {
    lines.push(section.title.toUpperCase());
    for (const entry of section.entries) {
      const parts = [entry.heading, entry.subheading, entry.date].filter(Boolean);
      if (parts.length) lines.push(parts.join(" | "));
      if (entry.body) lines.push(entry.body);
      for (const b of entry.bullets ?? []) lines.push(`- ${b}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

type PdfTemplate = "classic" | "modern" | "two-column";

const TEMPLATE_LABELS: Record<PdfTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  "two-column": "Two-Column",
};

export function ResumeResultPanel({ resume }: { resume: ResumeJSON }) {
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "docx" | null>(null);
  const [template, setTemplate] = useState<PdfTemplate>("classic");
  const [error, setError] = useState("");

  function handleCopy() {
    navigator.clipboard.writeText(toPlainText(resume));
  }

  async function handleDownload(format: "pdf" | "docx") {
    setDownloadingFormat(format);
    setError("");
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, format, template }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate file.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tailored-resume.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate file. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
        <h2 className="font-serif text-xl font-medium text-ink">
          Tailored Résumé
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCopy}
            className="cursor-pointer text-sm text-muted transition-colors hover:text-ink"
          >
            Copy
          </button>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as PdfTemplate)}
            className="rounded-[2px] border border-line-ink bg-paper px-2 py-1.5 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-forest"
            aria-label="PDF template"
          >
            {(Object.keys(TEMPLATE_LABELS) as PdfTemplate[]).map((t) => (
              <option key={t} value={t}>
                {TEMPLATE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleDownload("pdf")}
            disabled={downloadingFormat !== null}
            className="cursor-pointer rounded-[2px] border border-forest bg-transparent px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloadingFormat === "pdf" ? "Generating…" : "↓ PDF"}
          </button>
          <button
            onClick={() => handleDownload("docx")}
            disabled={downloadingFormat !== null}
            className="cursor-pointer rounded-[2px] border border-forest bg-transparent px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloadingFormat === "docx" ? "Generating…" : "↓ DOCX"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-[2px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ResumePreview resume={resume} />
    </div>
  );
}
