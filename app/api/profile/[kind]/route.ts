import { auth } from "@clerk/nextjs/server";
import { getSection, isSectionKind, sectionResponse } from "@/lib/profile/profileSection";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { kind } = await params;
  if (!isSectionKind(kind)) return Response.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  return sectionResponse(await getSection(kind).create(body));
}
