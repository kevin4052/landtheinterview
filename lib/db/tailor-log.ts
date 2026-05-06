import "server-only";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 10;

export type TailorLogSummary = {
  id: string;
  title: string | null;
  createdAt: Date;
};

export type TailorLogHistoryItem = {
  id: string;
  title: string | null;
  inputFilename: string | null;
  outputFormat: string | null;
  createdAt: Date;
};

export type TailorLogDetail = {
  title: string | null;
  inputFilename: string | null;
  outputText: string;
  createdAt: Date;
};

export type PaginatedTailorLogs = {
  logs: TailorLogHistoryItem[];
  total: number;
  totalPages: number;
};

export async function createTailorLog(
  clerkUserId: string,
  data: {
    resumeText: string;
    jobText: string;
    outputText: string;
    title: string;
  }
): Promise<void> {
  await prisma.tailoredResume.create({ data: { clerkUserId, ...data } });
}

export async function getRecentTailorLogs(
  clerkUserId: string,
  limit: number
): Promise<TailorLogSummary[]> {
  return prisma.tailoredResume.findMany({
    where: { clerkUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, createdAt: true },
  });
}

export async function getTailorLogPage(
  clerkUserId: string,
  page: number
): Promise<PaginatedTailorLogs> {
  const [logs, total] = await prisma.$transaction([
    prisma.tailoredResume.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        inputFilename: true,
        outputFormat: true,
        createdAt: true,
      },
    }),
    prisma.tailoredResume.count({ where: { clerkUserId } }),
  ]);

  return { logs, total, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getTailorLogById(
  clerkUserId: string,
  id: string
): Promise<TailorLogDetail | null> {
  return prisma.tailoredResume.findFirst({
    where: { id, clerkUserId },
    select: {
      title: true,
      inputFilename: true,
      outputText: true,
      createdAt: true,
    },
  });
}

export async function updateTailorLogTitle(
  clerkUserId: string,
  id: string,
  title: string
): Promise<{ id: string; title: string | null } | null> {
  const existing = await prisma.tailoredResume.findFirst({
    where: { id, clerkUserId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.tailoredResume.update({
    where: { id },
    data: { title },
    select: { id: true, title: true },
  });
}
