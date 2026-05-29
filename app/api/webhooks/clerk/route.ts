import { Webhook } from "svix";
import { headers } from "next/headers";
import { getAdminDb } from "@/lib/db/admin";
import { tenants } from "@/lib/db/schema";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: { id: string };
};

type ClerkEvent = ClerkUserCreatedEvent | { type: string; data: unknown };

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(secret);
  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const { id: clerkUserId } = (event as ClerkUserCreatedEvent).data;
    await getAdminDb()
      .insert(tenants)
      .values({ clerkUserId, plan: "free", lifetimeOpsUsed: 0, monthlyOpsUsed: 0 })
      .onConflictDoNothing(); // idempotent: Clerk retries must not 500 on duplicate
  }

  return Response.json({ ok: true });
}
