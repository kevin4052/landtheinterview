import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getTenantUsage } from "@/lib/db/tenant";
import { getRecentTailorLogs, getTailorLogCount } from "@/lib/db/tailor-log";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  let plan: "free" | "mid" | "pro" = "free";
  let usageRemaining: number | null = null;
  let usageTotal: number | null = null;
  let totalResumes = 0;
  let recentResumes: { id: string; title: string | null; createdAt: string }[] = [];

  try {
    const [usage, count, recent] = await Promise.all([
      getTenantUsage(),
      getTailorLogCount(),
      getRecentTailorLogs(4),
    ]);

    plan = usage.plan;
    usageRemaining = usage.usageRemaining;
    usageTotal = usage.usageTotal;
    totalResumes = count;
    recentResumes = recent.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[dashboard] failed to load page data", err);
  }

  return (
    <DashboardContent
      plan={plan}
      usageRemaining={usageRemaining}
      usageTotal={usageTotal}
      totalResumes={totalResumes}
      recentResumes={recentResumes}
    />
  );
}
