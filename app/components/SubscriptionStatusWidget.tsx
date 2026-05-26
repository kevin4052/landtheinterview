import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { tenants } from "@/lib/db/schema";

function computeRemaining(
  plan: "free" | "mid" | "pro",
  lifetimeOpsUsed: number,
  monthlyOpsUsed: number,
  currentPeriodEnd: Date | null
): string {
  if (plan === "pro") return "Unlimited";
  if (plan === "free") {
    const remaining = Math.max(0, 5 - lifetimeOpsUsed);
    return `${remaining} of 5 remaining (lifetime)`;
  }
  // Mid: apply same inline reset check as consumeAllowance (ADR-0008)
  const now = new Date();
  const effectiveUsed =
    currentPeriodEnd && now > currentPeriodEnd ? 0 : monthlyOpsUsed;
  const remaining = Math.max(0, 20 - effectiveUsed);
  return `${remaining} of 20 remaining this period`;
}

export async function SubscriptionStatusWidget() {
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

  if (!tenant) return null;

  const planLabels: Record<string, string> = {
    free: "Free",
    mid: "Mid",
    pro: "Pro",
  };

  const remaining = computeRemaining(
    tenant.plan,
    tenant.lifetimeOpsUsed,
    tenant.monthlyOpsUsed,
    tenant.currentPeriodEnd
  );

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between gap-4 text-sm">
      <div className="space-y-0.5">
        <span className="font-medium text-foreground">
          {planLabels[tenant.plan]} Plan
        </span>
        <p className="text-neutral-500">{remaining}</p>
      </div>
      {tenant.plan === "free" && (
        <Link
          href="/pricing"
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
