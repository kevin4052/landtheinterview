// The Profile Section HTTP client. Every collection section (Work Experience,
// Education, Skills, Personal Projects) mutates through the same two endpoints:
// the collection (`/api/profile/<slug>`) for create, and a single entry
// (`/api/profile/<slug>/<id>`) for update and remove. This module owns that
// addressing and the request shape so callers only name the section and the op.
//
// It is deliberately React-free and depends only on `fetch`, so the routing and
// ok/not-ok contract are unit-testable in the node test env — see
// profileSectionApi.test.ts. The React state machine lives in useProfileSection.

export type SectionOp = "create" | "update" | "remove";

const METHOD: Record<SectionOp, string> = {
  create: "POST",
  update: "PATCH",
  remove: "DELETE",
};

// Pure: resolve which endpoint and verb a section op hits. `create` addresses
// the collection; `update`/`remove` address a single entry and require an id.
export function buildSectionRequest(
  slug: string,
  op: SectionOp,
  id?: string
): { url: string; method: string } {
  const url = id ? `/api/profile/${slug}/${id}` : `/api/profile/${slug}`;
  return { url, method: METHOD[op] };
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function createEntry(slug: string, payload: unknown): Promise<boolean> {
  const { url, method } = buildSectionRequest(slug, "create");
  const res = await fetch(url, { method, headers: JSON_HEADERS, body: JSON.stringify(payload) });
  return res.ok;
}

export async function updateEntry(slug: string, id: string, payload: unknown): Promise<boolean> {
  const { url, method } = buildSectionRequest(slug, "update", id);
  const res = await fetch(url, { method, headers: JSON_HEADERS, body: JSON.stringify(payload) });
  return res.ok;
}

export async function deleteEntry(slug: string, id: string): Promise<boolean> {
  const { url, method } = buildSectionRequest(slug, "remove", id);
  const res = await fetch(url, { method });
  return res.ok;
}
