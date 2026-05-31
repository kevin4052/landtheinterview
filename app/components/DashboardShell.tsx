"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/history", label: "History", exact: false },
  { href: "/dashboard/profile", label: "Profile", exact: false },
];

const planLabels: Record<"free" | "mid" | "pro", string> = {
  free: "Free",
  mid: "Mid",
  pro: "Pro",
};

type DashboardShellProps = {
  children: React.ReactNode;
  plan: "free" | "mid" | "pro";
  usageRemaining: number | null;
  usageTotal: number | null;
};

export function DashboardShell({
  children,
  plan,
  usageRemaining,
  usageTotal,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName
      ? user.firstName
      : user?.emailAddresses?.[0]?.emailAddress ?? "";

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName
    ? user.firstName[0].toUpperCase()
    : (user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "?").toUpperCase();

  const hasUsage = usageRemaining != null && usageTotal != null;
  const pct = hasUsage ? Math.round((usageRemaining! / usageTotal!) * 100) : 100;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* dark sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex w-64 flex-col bg-slate-900 transition-transform duration-200 ease-in-out md:static md:top-auto md:bottom-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* brand */}
        <div className="px-5 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-extrabold tracking-wider">LI</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white/90 leading-tight">Land the Interview</p>
              <p className="text-[10px] text-slate-500 mt-0.5">AI Resume Tailoring</p>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-auto px-3 py-4">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Main
          </p>
          {navLinks.map(({ href, label, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 font-medium shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-indigo-400" : "bg-slate-700"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* footer: usage widget + user card */}
        <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 space-y-2 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-400">
              On the {planLabels[plan]} plan
            </p>
            {hasUsage ? (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {usageRemaining}/{usageTotal}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">Unlimited</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{displayName}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* mobile top bar */}
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-white px-4 py-2 md:hidden shrink-0">
          <button
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            {sidebarOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-neutral-50">{children}</div>
      </div>
    </div>
  );
}
