import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildSectionRequest,
  createEntry,
  updateEntry,
  deleteEntry,
} from "./profileSectionApi";

describe("buildSectionRequest", () => {
  it("create addresses the collection with POST", () => {
    expect(buildSectionRequest("work-experience", "create")).toEqual({
      url: "/api/profile/work-experience",
      method: "POST",
    });
  });

  it("update addresses a single entry with PATCH", () => {
    expect(buildSectionRequest("education", "update", "e1")).toEqual({
      url: "/api/profile/education/e1",
      method: "PATCH",
    });
  });

  it("remove addresses a single entry with DELETE", () => {
    expect(buildSectionRequest("skill-categories", "remove", "c9")).toEqual({
      url: "/api/profile/skill-categories/c9",
      method: "DELETE",
    });
  });
});

function mockFetch(ok: boolean) {
  const fetchMock = vi.fn().mockResolvedValue({ ok } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createEntry", () => {
  it("POSTs JSON to the collection and returns true on ok", async () => {
    const fetchMock = mockFetch(true);

    const result = await createEntry("personal-projects", { title: "Side project" });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/personal-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Side project" }),
    });
  });

  it("returns false when the server rejects", async () => {
    mockFetch(false);
    expect(await createEntry("work-experience", {})).toBe(false);
  });
});

describe("updateEntry", () => {
  it("PATCHes JSON to the entry and returns true on ok", async () => {
    const fetchMock = mockFetch(true);

    const result = await updateEntry("education", "e1", { school: "MIT" });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/education/e1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school: "MIT" }),
    });
  });

  it("returns false when the server rejects", async () => {
    mockFetch(false);
    expect(await updateEntry("education", "e1", {})).toBe(false);
  });
});

describe("deleteEntry", () => {
  it("DELETEs the entry with no body and returns true on ok", async () => {
    const fetchMock = mockFetch(true);

    const result = await deleteEntry("skill-categories", "c9");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/profile/skill-categories/c9", {
      method: "DELETE",
    });
  });

  it("returns false when the server rejects", async () => {
    mockFetch(false);
    expect(await deleteEntry("skill-categories", "c9")).toBe(false);
  });
});
