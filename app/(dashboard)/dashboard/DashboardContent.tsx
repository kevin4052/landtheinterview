"use client";

import { useRef } from "react";
import Link from "next/link";
import { TailorPanel, type TailorPanelHandle } from "@/app/components/TailorPanel";

const planLabels: Record<"free" | "mid" | "pro", string> = {
  free: "Free",
  mid: "Mid",
  pro: "Pro",
};

type Props = {
  plan: "free" | "mid" | "pro";
  usageRemaining: number | null;
  usageTotal: number | null;
  totalResumes: number;
  recentResumes: { id: string; title: string | null; createdAt: string }[];
};

export function DashboardContent({
  plan,
  usageRemaining,
  usageTotal,
  totalResumes,
  recentResumes,
}: Props) {
  const tailorRef = useRef<TailorPanelHandle>(null);
  const hasUsage = usageRemaining != null && usageTotal != null;
  const pct = hasUsage ? Math.round((usageRemaining! / usageTotal!) * 100) : 100;

  return (
    <div className="px-6 py-6 space-y-5">
      {/* page header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Dashboard</h1>
        <button
          onClick={() => tailorRef.current?.focusTextarea()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[2px] border border-forest bg-forest px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Tailor
        </button>
      </div>

      {/* slim stats strip */}
      <div className="flex items-center gap-6 rounded-[2px] border border-line-ink bg-card px-5 py-3.5">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Plan</span>
          <span className="font-serif text-sm font-medium italic text-forest">
            {planLabels[plan]}
          </span>
        </div>
        {hasUsage && (
          <>
            <div className="h-4 w-px bg-line-ink shrink-0" />
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted">Uses</span>
              <span className="font-serif text-base font-medium text-ink">
                {usageRemaining}
                <span className="font-normal text-muted">/{usageTotal}</span>
              </span>
              <div className="h-1.5 w-20 overflow-hidden bg-paper-2">
                <div className="h-full bg-forest" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </>
        )}
        <div className="h-4 w-px bg-line-ink shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">Résumés tailored</span>
          <span className="font-serif text-base font-medium text-ink">{totalResumes}</span>
        </div>
        {plan !== "pro" && (
          <Link
            href="/pricing"
            className="ml-auto shrink-0 rounded-[2px] border border-forest px-3 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-paper"
          >
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* tailor panel */}
      <div className="rounded-[2px] border border-line-ink bg-card p-6">
        <TailorPanel ref={tailorRef} />
      </div>

      {/* recent resumes card grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium text-ink">Recent Tailored Résumés</h2>
          <Link href="/dashboard/history" className="text-xs font-medium text-forest hover:text-ink">
            View all →
          </Link>
        </div>
        {recentResumes.length === 0 ? (
          <p className="text-sm text-muted">
            No tailored résumés yet. Paste a job posting above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recentResumes.map((r) => {
              const title = r.title ?? "Untitled Resume";
              const date = new Date(r.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/history/${r.id}`}
                  className="group rounded-[2px] border border-line-ink bg-card px-4 py-4 transition-colors hover:bg-paper-2"
                >
                  <p className="font-serif text-base font-medium leading-snug text-ink transition-colors group-hover:text-forest">
                    {title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{date}</span>
                    <span className="text-xs text-forest opacity-0 transition-opacity group-hover:opacity-100">
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
