import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResumeResultPanel } from "@/app/components/ResumeResultPanel";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;

  const resume = await prisma.tailoredResume.findFirst({
    where: { id, clerkUserId: userId },
    select: {
      inputFilename: true,
      outputText: true,
      createdAt: true,
    },
  });

  if (!resume) notFound();

  let resumeJson: ResumeJSON;
  try {
    resumeJson = JSON.parse(resume.outputText) as ResumeJSON;
  } catch {
    notFound();
  }

  const label = resume.inputFilename ?? "Pasted resume";
  const date = new Date(resume.createdAt).toLocaleDateString("en-US", {
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
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {label}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{date}</p>
        </div>
      </div>

      <ResumeResultPanel resume={resumeJson} />
    </main>
  );
}
