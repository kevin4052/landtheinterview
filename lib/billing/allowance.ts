import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { tenants } from "@/lib/db/schema";

export type AllowanceResult = { allowed: boolean };

export async function consumeAllowance(): Promise<AllowanceResult> {
  const db = await getDb();

  const [tenant] = await db.select().from(tenants).limit(1);
  if (!tenant) return { allowed: false };

  if (tenant.plan === "pro") return { allowed: true };

  if (tenant.plan === "free") {
    // Atomic: increment only when below the 5-op lifetime cap
    const rows = await db
      .update(tenants)
      .set({ lifetimeOpsUsed: sql`lifetime_ops_used + 1` })
      .where(sql`lifetime_ops_used < 5`)
      .returning({ id: tenants.id });
    return { allowed: rows.length > 0 };
  }

  // plan === "mid"
  // Atomic: if the billing period has elapsed (or was never set), reset the counter to 1
  // and start a fresh 30-day window. Otherwise increment if under 20.
  // NULL current_period_end is treated as an expired period so new mid tenants get a window.
  const rows = await db
    .update(tenants)
    .set({
      monthlyOpsUsed: sql`CASE WHEN current_period_end IS NULL OR NOW() > current_period_end THEN 1 ELSE monthly_ops_used + 1 END`,
      currentPeriodEnd: sql`CASE WHEN current_period_end IS NULL OR NOW() > current_period_end THEN NOW() + interval '30 days' ELSE current_period_end END`,
    })
    .where(sql`(current_period_end IS NULL OR NOW() > current_period_end) OR monthly_ops_used < 20`)
    .returning({ id: tenants.id });
  return { allowed: rows.length > 0 };
}
