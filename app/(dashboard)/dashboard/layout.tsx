import { DashboardShell } from "@/app/components/DashboardShell";
import { getTenantUsage } from "@/lib/db/tenant";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let plan: "free" | "mid" | "pro" = "free";
  let usageRemaining: number | null = 5;
  let usageTotal: number | null = 5;

  try {
    const usage = await getTenantUsage();
    plan = usage.plan;
    usageRemaining = usage.usageRemaining;
    usageTotal = usage.usageTotal;
  } catch (err) {
    console.error("[layout] failed to load tenant usage", err);
  }

  return (
    <DashboardShell plan={plan} usageRemaining={usageRemaining} usageTotal={usageTotal}>
      {children}
    </DashboardShell>
  );
}
