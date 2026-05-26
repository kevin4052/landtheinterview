import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { getStripe } from "@/lib/stripe/client";
import { tenants } from "@/lib/db/schema";

const BodySchema = z.object({ plan: z.enum(["mid", "pro"]) });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "plan must be mid or pro" }, { status: 400 });
  }

  const db = await getDb();
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).limit(1);
  if (!tenant) return Response.json({ error: "No tenant found" }, { status: 404 });

  const priceId =
    parsed.data.plan === "mid"
      ? process.env.STRIPE_MID_PRICE_ID!
      : process.env.STRIPE_PRO_PRICE_ID!;

  const origin = new URL(request.url).origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: tenant.id,
    metadata: { plan: parsed.data.plan },
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing`,
  });

  return Response.json({ url: session.url });
}
