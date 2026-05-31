import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client");
vi.mock("@/lib/db/schema", () => ({ tenants: {} }));

import { getDb } from "@/lib/db/client";
import { consumeAllowance } from "./allowance";

type TenantRow = {
  id: string;
  plan: "free" | "mid" | "pro";
  lifetimeOpsUsed: number;
  monthlyOpsUsed: number;
  currentPeriodEnd: Date | null;
  clerkUserId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

function makeTenant(overrides: Partial<TenantRow> = {}): TenantRow {
  return {
    id: "t1",
    clerkUserId: "user_123",
    plan: "free",
    lifetimeOpsUsed: 0,
    monthlyOpsUsed: 0,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    ...overrides,
  };
}

function buildMockDb(tenant: TenantRow | null, updateRows: { id: string }[] = [{ id: "t1" }]) {
  const returning = vi.fn().mockResolvedValue(updateRows);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });

  const limit = vi.fn().mockResolvedValue(tenant ? [tenant] : []);
  const from = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ from });

  return { select, update, set, where, returning };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("consumeAllowance", () => {
  it("Free tenant under limit: allowed, increments lifetime_ops_used", async () => {
    const db = buildMockDb(makeTenant({ plan: "free", lifetimeOpsUsed: 2 }));
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(true);
    expect(db.update).toHaveBeenCalledOnce();
    expect(db.returning).toHaveBeenCalledOnce();
  });

  it("Free tenant at limit (5): blocked, no AI call possible", async () => {
    const db = buildMockDb(makeTenant({ plan: "free", lifetimeOpsUsed: 5 }), []);
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(false);
  });

  it("Lapsed tenant (plan=free, lifetime_ops_used>5): blocked", async () => {
    const db = buildMockDb(makeTenant({ plan: "free", lifetimeOpsUsed: 7 }), []);
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(false);
  });

  it("Mid tenant under limit within current period: allowed, increments monthly_ops_used", async () => {
    const futureEnd = new Date(Date.now() + 1_000_000_000);
    const db = buildMockDb(makeTenant({ plan: "mid", monthlyOpsUsed: 5, currentPeriodEnd: futureEnd }));
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(true);
    expect(db.update).toHaveBeenCalledOnce();
  });

  it("Mid tenant at limit (20) within current period: blocked", async () => {
    const futureEnd = new Date(Date.now() + 1_000_000_000);
    const db = buildMockDb(
      makeTenant({ plan: "mid", monthlyOpsUsed: 20, currentPeriodEnd: futureEnd }),
      []
    );
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(false);
  });

  it("Mid tenant at limit but current_period_end in the past: counter resets, allowed", async () => {
    const pastEnd = new Date(Date.now() - 1_000_000_000);
    // The WHERE `NOW() > current_period_end` passes → DB returns a row (reset + 1 op used)
    const db = buildMockDb(
      makeTenant({ plan: "mid", monthlyOpsUsed: 20, currentPeriodEnd: pastEnd }),
      [{ id: "t1" }]
    );
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(true);
    expect(db.update).toHaveBeenCalledOnce();
  });

  it("Pro tenant: always allowed, no DB update issued", async () => {
    const db = buildMockDb(makeTenant({ plan: "pro", lifetimeOpsUsed: 100, monthlyOpsUsed: 100 }));
    vi.mocked(getDb).mockResolvedValue(db as never);

    const result = await consumeAllowance();

    expect(result.allowed).toBe(true);
    expect(db.update).not.toHaveBeenCalled();
  });
});
