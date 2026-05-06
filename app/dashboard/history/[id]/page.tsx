import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResumeResultPanel } from "@/app/components/ResumeResultPanel";
import { ResumeTitleEditor } from "@/app/components/ResumeTitleEditor";
import { getTailorLogById } from "@/lib/db/tailor-log";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;

  const log = await getTailorLogById(userId!, id);
  if (!log) notFound();

  let resumeJson: ResumeJSON;
  try {
    resumeJson = JSON.parse(log.outputText) as ResumeJSON;
  } catch {
    notFound();
  }

  const resolvedTitle = log.title ?? log.inputFilename ?? "Pasted resume";
  const date = new Date(log.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard/history"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          ← Resume History
        </Link>
        <div className="mt-4">
          <ResumeTitleEditor id={id} title={resolvedTitle} />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{date}</p>
        </div>
      </div>

      <ResumeResultPanel resume={resumeJson} />
    </main>
  );
}
