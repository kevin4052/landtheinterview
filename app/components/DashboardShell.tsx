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
          className="fixed inset-0 z-20 bg-ink/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* forest sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex w-64 flex-col bg-forest text-paper transition-transform duration-200 ease-in-out md:static md:top-auto md:bottom-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* brand */}
        <div className="px-5 py-5 border-b border-paper/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-paper/70 font-serif text-base font-semibold italic text-paper">
              L
            </div>
            <div>
              <p className="font-serif text-[15px] font-semibold leading-tight text-paper">
                Land the Interview
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-paper/50">
                The tailored résumé
              </p>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/40">
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
                className={`mb-0.5 flex items-center gap-2.5 rounded-[2px] px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-paper/10 font-medium text-paper"
                    : "text-paper/60 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                <span
                  className={`text-xs ${isActive ? "text-gold" : "text-paper/30"}`}
                >
                  ✦
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* footer: usage widget + user card */}
        <div className="px-3 pb-4 border-t border-paper/15 pt-3 space-y-2 shrink-0">
          <div className="border-t border-paper/30 px-3 py-3">
            <p className="font-serif text-sm italic text-paper/70">
              On the {planLabels[plan]} plan
            </p>
            {hasUsage ? (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden bg-paper/20">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] text-paper/60">
                  {usageRemaining}/{usageTotal}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-paper/50">
                Unlimited
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-[2px] bg-forest-2 px-3 py-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-paper/50 font-serif text-xs italic text-paper">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-paper/90">{displayName}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* mobile top bar */}
        <div className="flex items-center gap-2 border-b border-line-ink bg-paper px-4 py-2 md:hidden shrink-0">
          <button
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-[2px] p-1.5 text-ink-soft transition-colors hover:bg-paper-2"
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
        <div className="flex-1 overflow-auto bg-paper">{children}</div>
      </div>
    </div>
  );
}
