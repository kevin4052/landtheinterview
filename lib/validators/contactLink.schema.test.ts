import { describe, it, expect } from "vitest";
import {
  normalizeContactUrl,
  ContactLinkSchema,
  ContactLinksSchema,
} from "./contactLink.schema";

describe("normalizeContactUrl", () => {
  it("auto-prefixes scheme-less input with https://", () => {
    expect(normalizeContactUrl("linkedin.com/in/jane")).toBe(
      "https://linkedin.com/in/jane"
    );
  });

  it("leaves https URLs unchanged", () => {
    expect(normalizeContactUrl("https://github.com/jane")).toBe(
      "https://github.com/jane"
    );
  });

  it("leaves http URLs unchanged", () => {
    expect(normalizeContactUrl("http://example.com")).toBe(
      "http://example.com"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeContactUrl("  github.com/jane  ")).toBe(
      "https://github.com/jane"
    );
  });

  it("rejects empty and whitespace-only input", () => {
    expect(normalizeContactUrl("")).toBeNull();
    expect(normalizeContactUrl("   ")).toBeNull();
  });

  it("rejects non-http(s) schemes", () => {
    expect(normalizeContactUrl("ftp://example.com")).toBeNull();
  });

  it("rejects input that does not parse as a URL after prefixing", () => {
    expect(normalizeContactUrl("not a url")).toBeNull();
    expect(normalizeContactUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("ContactLinkSchema", () => {
  it("accepts a valid link and normalizes its URL", () => {
    const result = ContactLinkSchema.safeParse({
      label: "LinkedIn",
      url: "linkedin.com/in/jane",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        label: "LinkedIn",
        url: "https://linkedin.com/in/jane",
      });
    }
  });

  it("rejects an empty label", () => {
    const result = ContactLinkSchema.safeParse({
      label: "  ",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a label over 40 chars", () => {
    const result = ContactLinkSchema.safeParse({
      label: "x".repeat(41),
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a label of exactly 40 chars", () => {
    const result = ContactLinkSchema.safeParse({
      label: "x".repeat(40),
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unparseable URL", () => {
    const result = ContactLinkSchema.safeParse({
      label: "Portfolio",
      url: "not a url",
    });
    expect(result.success).toBe(false);
  });
});

describe("ContactLinksSchema", () => {
  it("accepts an empty array", () => {
    expect(ContactLinksSchema.safeParse([]).success).toBe(true);
  });

  it("preserves order across multiple links", () => {
    const result = ContactLinksSchema.safeParse([
      { label: "GitHub", url: "github.com/jane" },
      { label: "X", url: "x.com/jane" },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.map((l) => l.label)).toEqual(["GitHub", "X"]);
    }
  });

  it("rejects the whole array when one link is invalid", () => {
    const result = ContactLinksSchema.safeParse([
      { label: "GitHub", url: "github.com/jane" },
      { label: "", url: "github.com/jane" },
    ]);
    expect(result.success).toBe(false);
  });
});
