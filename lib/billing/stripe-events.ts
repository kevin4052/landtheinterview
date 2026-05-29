import "server-only";
import { eq, sql } from "drizzle-orm";
import { getAdminDb } from "@/lib/db/admin";
import { tenants } from "@/lib/db/schema";
import type Stripe from "stripe";

function planFromPriceId(priceId: string): "mid" | "pro" | null {
  if (priceId === process.env.STRIPE_MID_PRICE_ID) return "mid";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return null;
}

// checkout.session.completed — initial subscription purchase
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const tenantId = session.client_reference_id;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  const raw = session.metadata?.plan;
  const plan: "mid" | "pro" | null = raw === "mid" || raw === "pro" ? raw : null;

  if (!tenantId || !customerId || !subscriptionId || !plan) return;

  await getAdminDb()
    .update(tenants)
    .set({ plan, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId })
    .where(eq(tenants.id, tenantId));
}

// customer.subscription.updated — plan or period changes
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) return;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : null;
  if (!plan) return;

  // In Stripe v22+, current_period_end lives on the SubscriptionItem, not Subscription
  if (!item?.current_period_end) {
    console.error("[stripe-events] subscription.updated missing current_period_end", { customerId });
    return;
  }
  const periodEnd = new Date(item.current_period_end * 1000);

  await getAdminDb()
    .update(tenants)
    .set({ plan, currentPeriodEnd: periodEnd })
    .where(eq(tenants.stripeCustomerId, customerId));
}

// customer.subscription.deleted — subscription cancelled
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) return;

  await getAdminDb()
    .update(tenants)
    .set({ plan: "free" })
    .where(eq(tenants.stripeCustomerId, customerId));
}

// invoice.payment_failed — hard cutoff, no grace period
export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;

  await getAdminDb()
    .update(tenants)
    .set({ plan: "free" })
    .where(eq(tenants.stripeCustomerId, customerId));
}
