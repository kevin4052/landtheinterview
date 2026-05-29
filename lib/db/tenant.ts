import "server-only";
import { getDb } from "./client";
import { tenants } from "./schema";

export type TenantUsage = {
  plan: "free" | "mid" | "pro";
  usageRemaining: number | null; // null = unlimited (pro)
  usageTotal: number | null;
};

export async function getTenantUsage(): Promise<TenantUsage> {
  const db = await getDb();
  const [tenant] = await db
    .select({
      plan: tenants.plan,
      lifetimeOpsUsed: tenants.lifetimeOpsUsed,
      monthlyOpsUsed: tenants.monthlyOpsUsed,
      currentPeriodEnd: tenants.currentPeriodEnd,
    })
    .from(tenants)
    .limit(1);

  if (!tenant) return { plan: "free", usageRemaining: 5, usageTotal: 5 };

  if (tenant.plan === "pro") {
    return { plan: "pro", usageRemaining: null, usageTotal: null };
  }

  if (tenant.plan === "free") {
    return {
      plan: "free",
      usageRemaining: Math.max(0, 5 - tenant.lifetimeOpsUsed),
      usageTotal: 5,
    };
  }

  // mid: mirror the NULL-safe reset check in consumeAllowance (ADR-0008)
  // NULL currentPeriodEnd means the period was never set; treat as expired (full allowance).
  const now = new Date();
  const effectiveUsed =
    !tenant.currentPeriodEnd || now > tenant.currentPeriodEnd
      ? 0
      : tenant.monthlyOpsUsed;
  return {
    plan: "mid",
    usageRemaining: Math.max(0, 20 - effectiveUsed),
    usageTotal: 20,
  };
}
