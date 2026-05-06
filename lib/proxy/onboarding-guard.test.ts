import { describe, it, expect } from "vitest";
import { needsOnboardingRedirect } from "./onboarding-guard";

describe("needsOnboardingRedirect", () => {
  it("redirects authenticated user with incomplete profile on /dashboard", () => {
    expect(needsOnboardingRedirect("/dashboard", "user_123", false)).toBe(true);
  });

  it("passes through authenticated user with complete profile on /dashboard", () => {
    expect(needsOnboardingRedirect("/dashboard", "user_123", true)).toBe(false);
  });

  it("passes through /onboarding to avoid redirect loop", () => {
    expect(needsOnboardingRedirect("/onboarding", "user_123", false)).toBe(false);
  });

  it("passes through /api routes", () => {
    expect(needsOnboardingRedirect("/api/tailor", "user_123", false)).toBe(false);
  });

  it("passes through unauthenticated requests on /dashboard", () => {
    expect(needsOnboardingRedirect("/dashboard", null, false)).toBe(false);
  });

  it("redirects on nested /dashboard/* paths", () => {
    expect(needsOnboardingRedirect("/dashboard/profile", "user_123", false)).toBe(true);
    expect(needsOnboardingRedirect("/dashboard/history", "user_123", false)).toBe(true);
  });
});
