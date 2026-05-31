import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { profileIsCompleteAdmin } from "@/lib/db/profile";
import { needsOnboardingRedirect } from "@/lib/proxy/onboarding-guard";

const isPublicRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/dashboard")) {
    const { userId } = await auth();
    if (userId) {
      const complete = await profileIsCompleteAdmin(userId);
      if (needsOnboardingRedirect(pathname, userId, complete)) {
        return NextResponse.redirect(new URL("/onboarding", request.url), 307);
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    '/__clerk/(.*)',
  ],
};
