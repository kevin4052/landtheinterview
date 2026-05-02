import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function HistoryPage() {
  const { userId } = await auth();

  const resumes = await prisma.tailoredResume.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      inputFilename: true,
      outputFormat: true,
      createdAt: true,
    },
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Resume History</h1>
        <Link
          href="/upload"
          className="text-sm font-medium px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No tailored resumes yet.{" "}
          <Link href="/upload" className="underline">
            Create your first one.
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {resumes.map((r) => (
            <li key={r.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">
                  {r.inputFilename ?? "Pasted resume"}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/api/resumes/${r.id}/download?format=pdf`}
                  className="text-xs font-medium px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  PDF
                </a>
                <a
                  href={`/api/resumes/${r.id}/download?format=docx`}
                  className="text-xs font-medium px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  DOCX
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
