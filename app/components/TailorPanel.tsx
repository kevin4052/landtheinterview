"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { ResumeResultPanel } from "@/app/components/ResumeResultPanel";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

export type TailorPanelHandle = {
  focusTextarea: () => void;
};

export const TailorPanel = forwardRef<TailorPanelHandle>(
  function TailorPanel(_, ref) {
  const [jobText, setJobText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "exhausted">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeJSON | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focusTextarea() {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current?.focus();
    },
  }));

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
      <h2 className="font-serif text-xl font-medium text-ink mb-4">Tailor My Résumé</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          ref={textareaRef}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Paste a job posting here…"
          rows={8}
          disabled={status === "loading"}
          className="w-full rounded-[2px] border border-line-ink bg-paper px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest resize-y disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {status === "exhausted" && (
          <div className="rounded-[2px] border border-gold/50 bg-gold/10 px-4 py-4 text-sm">
            <p className="font-serif text-base font-medium italic text-ink">
              You&apos;ve reached your Tailor Allowance.
            </p>
            <p className="mt-1 text-ink-soft">
              Upgrade your plan to continue tailoring résumés.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-[2px] border border-forest bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink"
            >
              View pricing →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[2px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !jobText.trim()}
          className="cursor-pointer rounded-[2px] border border-forest bg-forest px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Tailoring…" : "Tailor My Résumé"}
        </button>
      </form>

      {result && (
        <div className="mt-8 border-t border-line-ink pt-8">
          <ResumeResultPanel resume={result} />
        </div>
      )}
    </section>
  );
});
