import { z } from "zod";

// Scheme-less input ("linkedin.com/in/x") is auto-prefixed with https://,
// then must parse as an http(s) URL. Returns the normalized URL string, or
// null when the input cannot be made into a valid http(s) URL.
export function normalizeContactUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return candidate;
}

export const ContactLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.string().transform((value, ctx) => {
    const normalized = normalizeContactUrl(value);
    if (normalized === null) {
      ctx.addIssue({ code: "custom", message: "Invalid URL" });
      return z.NEVER;
    }
    return normalized;
  }),
});

export const ContactLinksSchema = z.array(ContactLinkSchema);
