export function needsOnboardingRedirect(
  pathname: string,
  userId: string | null,
  profileComplete: boolean
): boolean {
  if (!userId) return false;
  if (!pathname.startsWith("/dashboard")) return false;
  return !profileComplete;
}
