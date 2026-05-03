ALTER TABLE "TailoredResume" ADD COLUMN "clerkUserId" TEXT;
CREATE INDEX "TailoredResume_clerkUserId_idx" ON "TailoredResume"("clerkUserId");
