import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ResumeHistoryItem } from "@/app/components/ResumeHistoryItem";
import { getTailorLogPage } from "@/lib/db/tailor-log";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let logs: { id: string; title: string | null; inputFilename: string | null; outputFormat: string | null; createdAt: Date }[] = [];
  let totalPages = 1;
  let dbError = false;

  try {
    const result = await getTailorLogPage(page);
    logs = result.logs;
    totalPages = result.totalPages;
  } catch {
    dbError = true;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Resume History</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          New Resume
        </Link>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load your resume history. Please try refreshing the page. If the problem persists, the database may be temporarily unavailable.
        </div>
      ) : logs.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No tailored resumes yet.{" "}
          <Link href="/dashboard" className="underline">
            Create your first one.
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-neutral-200">
            {logs.map((r) => (
              <ResumeHistoryItem
                key={r.id}
                id={r.id}
                title={r.title ?? r.inputFilename ?? "Pasted resume"}
                date={new Date(r.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 text-sm">
              {page > 1 ? (
                <Link
                  href={`/dashboard/history?page=${page - 1}`}
                  className="px-3 py-1.5 rounded border border-neutral-200 hover:border-neutral-400 transition-colors"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-neutral-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/dashboard/history?page=${page + 1}`}
                  className="px-3 py-1.5 rounded border border-neutral-200 hover:border-neutral-400 transition-colors"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
