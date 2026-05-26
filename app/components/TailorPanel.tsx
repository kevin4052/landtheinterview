"use client";

import { useState } from "react";
import Link from "next/link";
import { ResumeResultPanel } from "@/app/components/ResumeResultPanel";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

export function TailorPanel() {
  const [jobText, setJobText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "exhausted">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeJSON | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobText.trim()) return;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobText }),
      });

      if (res.status === 402) {
        setStatus("exhausted");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to tailor resume. Please try again.");
        setStatus("error");
        return;
      }

      const resumeJson = (await res.json()) as ResumeJSON;
      setResult(resumeJson);
      setStatus("idle");
    } catch {
      setError("Failed to tailor resume. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Tailor My Resume</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Paste a job posting here…"
          rows={8}
          disabled={status === "loading"}
          className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-foreground placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary resize-y disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {status === "exhausted" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm">
            <p className="font-medium text-amber-900">You&apos;ve reached your Tailor Allowance.</p>
            <p className="mt-1 text-amber-700">
              Upgrade your plan to continue tailoring resumes.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              View pricing →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !jobText.trim()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Tailoring…" : "Tailor My Resume"}
        </button>
      </form>

      {result && (
        <div className="mt-8 border-t border-neutral-200 pt-8">
          <ResumeResultPanel resume={result} />
        </div>
      )}
    </section>
  );
}
