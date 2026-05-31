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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => tailorRef.current?.focusTextarea()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Tailor
        </button>
      </div>

      {/* slim stats strip */}
      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-3.5 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Plan</span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            {planLabels[plan]}
          </span>
        </div>
        {hasUsage && (
          <>
            <div className="h-4 w-px bg-neutral-200 shrink-0" />
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-neutral-500">Uses</span>
              <span className="text-sm font-bold text-slate-800">
                {usageRemaining}
                <span className="text-neutral-400 font-normal">/{usageTotal}</span>
              </span>
              <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </>
        )}
        <div className="h-4 w-px bg-neutral-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">Resumes tailored</span>
          <span className="text-sm font-bold text-slate-800">{totalResumes}</span>
        </div>
        {plan !== "pro" && (
          <Link
            href="/pricing"
            className="ml-auto text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* tailor panel */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">
        <TailorPanel ref={tailorRef} />
      </div>

      {/* recent resumes card grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Recent Tailored Resumes</h2>
          <Link href="/dashboard/history" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        </div>
        {recentResumes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No tailored resumes yet. Paste a job posting above to get started.
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
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors leading-snug">
                    {title}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-400">{date}</span>
                    <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
