import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { performTailor, tailorResponse } from "@/lib/tailor/performTailor";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await performTailor(body);
  if (result.ok) after(result.commitLog);
  return tailorResponse(result);
}
