import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { ResumeHistoryItem } from "@/app/components/ResumeHistoryItem";

export default async function HistoryPage() {
  const { userId } = await auth();

  let resumes: { id: string; inputFilename: string | null; title: string | null; outputFormat: string | null; createdAt: Date }[] = [];
  let dbError = false;

  try {
    resumes = await prisma.tailoredResume.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        inputFilename: true,
        title: true,
        outputFormat: true,
        createdAt: true,
      },
    });
  } catch {
    dbError = true;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Resume History</h1>
        <Link
          href="/upload"
          className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          New Resume
        </Link>
      </div>

      {dbError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load your resume history. Please try refreshing the page. If the problem persists, the database may be temporarily unavailable.
        </div>
      ) : resumes.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No tailored resumes yet.{" "}
          <Link href="/upload" className="underline">
            Create your first one.
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {resumes.map((r) => (
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
      )}
    </main>
  );
}
