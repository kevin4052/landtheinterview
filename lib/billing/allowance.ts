import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { tenants } from "@/lib/db/schema";

// A successful reservation hands back its own compensating undo. `release` is
// closed over the plan and the scoped db, so it can't be called without a prior
// reserve and never re-queries. Calling it decrements the same counter the
// reserve incremented (pro is a no-op). See ADR-0008 for the inline period reset.
export type AllowanceReservation =
  | { allowed: true; release: () => Promise<void> }
  | { allowed: false };

export async function consumeAllowance(): Promise<AllowanceReservation> {
  const db = await getDb();

  const [tenant] = await db.select().from(tenants).limit(1);
  if (!tenant) return { allowed: false };

  if (tenant.plan === "pro") {
    return { allowed: true, release: async () => {} };
  }

  if (tenant.plan === "free") {
    // Atomic: increment only when below the 5-op lifetime cap
    const rows = await db
      .update(tenants)
      .set({ lifetimeOpsUsed: sql`lifetime_ops_used + 1` })
      .where(sql`lifetime_ops_used < 5`)
      .returning({ id: tenants.id });
    if (rows.length === 0) return { allowed: false };
    return {
      allowed: true,
      release: async () => {
        await db
          .update(tenants)
          .set({ lifetimeOpsUsed: sql`lifetime_ops_used - 1` })
          .where(sql`lifetime_ops_used > 0`);
      },
    };
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
  if (rows.length === 0) return { allowed: false };
  return {
    allowed: true,
    // A release after a fresh-period reset leaves monthly_ops_used at 0 with the
    // new window already open — the window starts a touch early and self-corrects
    // on the next op. The currentPeriodEnd is intentionally left in place.
    release: async () => {
      await db
        .update(tenants)
        .set({ monthlyOpsUsed: sql`monthly_ops_used - 1` })
        .where(sql`monthly_ops_used > 0`);
    },
  };
}
