import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/admin");
vi.mock("@/lib/db/schema", () => ({ tenants: {} }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(), sql: vi.fn() }));

import { getAdminDb } from "@/lib/db/admin";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from "./stripe-events";
import type Stripe from "stripe";

const MID_PRICE = "price_mid_test";
const PRO_PRICE = "price_pro_test";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_MID_PRICE_ID = MID_PRICE;
  process.env.STRIPE_PRO_PRICE_ID = PRO_PRICE;
});

function buildMockDb() {
  const returning = vi.fn().mockResolvedValue([]);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  return { update, set, where, returning };
}

describe("handleCheckoutCompleted", () => {
  it("upgrades plan and stores Stripe IDs on the tenant", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const session = {
      client_reference_id: "tenant-uuid-1",
      customer: "cus_test123",
      subscription: "sub_test123",
      metadata: { plan: "mid" },
    } as Partial<Stripe.Checkout.Session>;

    await handleCheckoutCompleted(session as Stripe.Checkout.Session);

    expect(db.update).toHaveBeenCalledOnce();
    expect(db.set).toHaveBeenCalledWith({
      plan: "mid",
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test123",
    });
  });

  it("does nothing when client_reference_id is missing", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const session = {
      client_reference_id: null,
      customer: "cus_test123",
      subscription: "sub_test123",
      metadata: { plan: "mid" },
    } as Partial<Stripe.Checkout.Session>;

    await handleCheckoutCompleted(session as Stripe.Checkout.Session);

    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("handleSubscriptionUpdated", () => {
  it("updates plan and current_period_end on the tenant", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const periodEnd = Math.floor(Date.now() / 1000) + 2_592_000; // +30 days
    const subscription = {
      customer: "cus_test123",
      items: { data: [{ price: { id: PRO_PRICE }, current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription;

    await handleSubscriptionUpdated(subscription as Stripe.Subscription);

    expect(db.update).toHaveBeenCalledOnce();
    const setCall = db.set.mock.calls[0][0];
    expect(setCall.plan).toBe("pro");
    expect(setCall.currentPeriodEnd).toBeInstanceOf(Date);
  });

  it("does nothing when price ID is not recognised", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const subscription = {
      customer: "cus_test123",
      items: { data: [{ price: { id: "price_unknown" }, current_period_end: 9999999999 }] },
    } as unknown as Stripe.Subscription;

    await handleSubscriptionUpdated(subscription as Stripe.Subscription);

    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("handleSubscriptionDeleted", () => {
  it("reverts plan to free", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const subscription = { customer: "cus_test123" } as Partial<Stripe.Subscription>;

    await handleSubscriptionDeleted(subscription as Stripe.Subscription);

    expect(db.update).toHaveBeenCalledOnce();
    expect(db.set).toHaveBeenCalledWith({ plan: "free" });
  });
});

describe("handlePaymentFailed", () => {
  it("reverts plan to free immediately", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const invoice = { customer: "cus_test123" } as Partial<Stripe.Invoice>;

    await handlePaymentFailed(invoice as Stripe.Invoice);

    expect(db.update).toHaveBeenCalledOnce();
    expect(db.set).toHaveBeenCalledWith({ plan: "free" });
  });

  it("does nothing when customer is missing", async () => {
    const db = buildMockDb();
    vi.mocked(getAdminDb).mockReturnValue(db as never);

    const invoice = { customer: null } as Partial<Stripe.Invoice>;

    await handlePaymentFailed(invoice as Stripe.Invoice);

    expect(db.update).not.toHaveBeenCalled();
  });
});
