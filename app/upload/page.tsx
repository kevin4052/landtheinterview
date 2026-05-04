"use client";

import { useState, useRef, useCallback } from "react";
import { ResumePreview } from "@/app/components/ResumePreview";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";
import { resumeToText } from "@/lib/utils/resumeToText";

type FileMetadata = {
  filename: string;
  format: "pdf" | "docx" | "txt";
};

type PdfTemplate = "classic" | "modern" | "two-column";

const TEMPLATE_LABELS: Record<PdfTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  "two-column": "Two-Column",
};

export default function UploadPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [output, setOutput] = useState<ResumeJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "docx" | null>(null);
  const [template, setTemplate] = useState<PdfTemplate>("classic");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    setParsing(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse file.");
        return;
      }
      setResumeText(data.text);
      setFileMeta({ filename: data.filename, format: data.format });
    } catch {
      setError("Failed to parse file. Please try again.");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput(null);
    setError("");

    try {
      const body: Record<string, string> = { resumeText, jobText };
      if (fileMeta) {
        body.inputFilename = fileMeta.filename;
        body.inputFormat = fileMeta.format;
      } else {
        body.inputFormat = "paste";
      }

      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const resumeJson = await response.json() as ResumeJSON;
      setOutput(resumeJson);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(resumeToText(output));
  }

  async function handleDownload(format: "pdf" | "docx") {
    if (!output) return;
    setDownloadingFormat(format);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: output, format, template }),
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

  const canSubmit =
    resumeText.trim().length > 0 && jobText.trim().length > 0 && !parsing;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Land the Interview
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Upload or paste your resume and a job posting. We&apos;ll tailor
            your resume to the role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume input with drag-and-drop */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Your Resume
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Upload file
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative rounded-lg border transition-colors ${
                  dragging
                    ? "border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {parsing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 dark:bg-zinc-900/80 z-10">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Parsing file…
                    </span>
                  </div>
                )}
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    if (fileMeta) setFileMeta(null);
                  }}
                  placeholder={
                    dragging
                      ? "Drop file here…"
                      : "Paste your resume or drag & drop a PDF, DOCX, or TXT file…"
                  }
                  rows={18}
                  className="w-full rounded-lg bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
                {fileMeta && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="uppercase font-medium">{fileMeta.format}</span>
                    <span className="truncate max-w-32">{fileMeta.filename}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileMeta(null);
                        setResumeText("");
                      }}
                      className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Job posting — paste only */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Job Posting
              </label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the job description here…"
                rows={18}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 px-6 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Tailoring your resume…" : "Tailor My Resume"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {(output || loading) && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Tailored Resume
              </h2>
              {output && !loading && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Copy
                  </button>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as PdfTemplate)}
                    className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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
                    className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {downloadingFormat === "pdf" ? "Generating…" : "↓ PDF"}
                  </button>
                  <button
                    onClick={() => handleDownload("docx")}
                    disabled={downloadingFormat !== null}
                    className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {downloadingFormat === "docx" ? "Generating…" : "↓ DOCX"}
                  </button>
                </div>
              )}
            </div>

            {loading && !output && (
              <div className="flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-16">
                <span className="text-sm text-zinc-400 dark:text-zinc-600">
                  Tailoring your resume…
                </span>
              </div>
            )}

            {output && <ResumePreview resume={output} />}
          </div>
        )}
      </div>
    </div>
  );
}
