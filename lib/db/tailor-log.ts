import "server-only";
import { desc, eq, count, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { tailoredResumes } from "@/lib/db/schema";

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
  data: {
    resumeText: string;
    jobText: string;
    outputText: string;
    title: string;
  }
): Promise<void> {
  const db = await getDb();
  await db.insert(tailoredResumes).values({
    tenantId: sql`(SELECT id FROM tenants WHERE clerk_user_id = auth.user_id())`,
    ...data,
  });
}

export async function getRecentTailorLogs(
  limit: number
): Promise<TailorLogSummary[]> {
  const db = await getDb();
  return db
    .select({
      id: tailoredResumes.id,
      title: tailoredResumes.title,
      createdAt: tailoredResumes.createdAt,
    })
    .from(tailoredResumes)
    .orderBy(desc(tailoredResumes.createdAt))
    .limit(limit);
}

export async function getTailorLogPage(
  page: number
): Promise<PaginatedTailorLogs> {
  const db = await getDb();
  const [logs, [{ total }]] = await Promise.all([
    db
      .select({
        id: tailoredResumes.id,
        title: tailoredResumes.title,
        inputFilename: tailoredResumes.inputFilename,
        outputFormat: tailoredResumes.outputFormat,
        createdAt: tailoredResumes.createdAt,
      })
      .from(tailoredResumes)
      .orderBy(desc(tailoredResumes.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(tailoredResumes),
  ]);
  return { logs, total: Number(total), totalPages: Math.ceil(Number(total) / PAGE_SIZE) };
}

export async function getTailorLogById(
  id: string
): Promise<TailorLogDetail | null> {
  const db = await getDb();
  const [entry] = await db
    .select({
      title: tailoredResumes.title,
      inputFilename: tailoredResumes.inputFilename,
      outputText: tailoredResumes.outputText,
      createdAt: tailoredResumes.createdAt,
    })
    .from(tailoredResumes)
    .where(eq(tailoredResumes.id, id))
    .limit(1);
  return entry ?? null;
}

export async function updateTailorLogTitle(
  id: string,
  title: string
): Promise<{ id: string; title: string | null } | null> {
  const db = await getDb();
  const [entry] = await db
    .update(tailoredResumes)
    .set({ title })
    .where(eq(tailoredResumes.id, id))
    .returning({ id: tailoredResumes.id, title: tailoredResumes.title });
  return entry ?? null;
}
