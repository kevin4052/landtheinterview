import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TailorPanel } from "@/app/components/TailorPanel";
import { SubscriptionStatusWidget } from "@/app/components/SubscriptionStatusWidget";
import { getRecentTailorLogs } from "@/lib/db/tailor-log";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) notFound();

  let recentResumes: { id: string; title: string | null; createdAt: Date }[] = [];

  try {
    recentResumes = await getRecentTailorLogs(5);
  } catch (err) {
    console.error("[dashboard] failed to load recent resumes", err);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-12">
      <Suspense fallback={null}>
        <SubscriptionStatusWidget />
      </Suspense>
      <TailorPanel />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Tailored Resumes</h2>
          <Link
            href="/dashboard/history"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentResumes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No tailored resumes yet. Paste a job posting above to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentResumes.map((r) => {
              const title = r.title ?? "Untitled Resume";
              const date = new Date(r.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/history/${r.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-block h-5 w-16 rounded-full border border-dashed border-neutral-200" aria-hidden="true" />
                      <span className="text-xs text-neutral-400">View →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
