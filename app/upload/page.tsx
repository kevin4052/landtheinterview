"use client";

import { useState } from "react";

export default function UploadPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    setError("");

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobText }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
  }

  const canSubmit = resumeText.trim().length > 0 && jobText.trim().length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Land the Interview
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Paste your resume and a job posting. We&apos;ll tailor your resume
            to the role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your Resume
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here..."
                rows={18}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Job Posting
              </label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the job description here..."
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Tailored Resume
              </h2>
              {output && !loading && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Copy to clipboard
                </button>
              )}
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-5 text-sm text-zinc-800 dark:text-zinc-200 font-mono leading-relaxed min-h-24">
              {output}
              {loading && !output && (
                <span className="text-zinc-400 dark:text-zinc-600">
                  Generating…
                </span>
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
