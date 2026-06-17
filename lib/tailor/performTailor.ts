import "server-only";
import type { ResumeJSON } from "@/lib/validators/resumeJson.schema";
import { TailorRequestSchema } from "@/lib/validators/tailor.schema";
import { getProfile } from "@/lib/db/profile";
import { consumeAllowance } from "@/lib/billing/allowance";
import { runTailor } from "@/lib/tailor/runTailor";
import { createTailorLog } from "@/lib/db/tailor-log";
import { assembleTailoredResumeTitle } from "@/lib/utils/assembleTailoredResumeTitle";

// The Tailor Operation (CONTEXT.md): the full guarded action behind a single
// tailor request. It owns the ordering invariant — validate before reserve,
// release on failure — so a malformed body or a failed Tailor never spends
// Allowance. On success it returns `commitLog`, a thunk the caller schedules
// post-response (the module stays free of next/server's `after`).
export type TailorResult =
  | { ok: true; resume: ResumeJSON; commitLog: () => Promise<void> }
  | {
      ok: false;
      reason: "invalid_request" | "no_profile" | "allowance_exhausted" | "tailor_failed";
    };

export async function performTailor(body: unknown): Promise<TailorResult> {
  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid_request" };

  const profile = await getProfile();
  if (!profile) return { ok: false, reason: "no_profile" };

  const reservation = await consumeAllowance();
  if (!reservation.allowed) return { ok: false, reason: "allowance_exhausted" };

  try {
    const { resumeJson, resumeText, jobTitle, companyName } = await runTailor(
      profile,
      parsed.data.jobText
    );

    const commitLog = async () => {
      try {
        const createdAt = new Date();
        const title = assembleTailoredResumeTitle(jobTitle, companyName, createdAt);
        await createTailorLog({
          resumeText,
          jobText: parsed.data.jobText,
          outputText: JSON.stringify(resumeJson),
          title,
        });
      } catch (err) {
        console.error("[tailor] DB write failed:", err);
      }
    };

    return { ok: true, resume: resumeJson, commitLog };
  } catch (err) {
    console.error("[tailor] AI call failed:", err);
    await reservation.release();
    return { ok: false, reason: "tailor_failed" };
  }
}

// Mirrors `sectionResponse` in lib/profile/profileSection.ts: maps the
// discriminated result to HTTP, preserving the original status codes.
export function tailorResponse(result: TailorResult): Response {
  if (result.ok) return Response.json(result.resume);
  switch (result.reason) {
    case "invalid_request":
      return Response.json({ error: "Job posting text is required" }, { status: 400 });
    case "no_profile":
      return Response.json(
        { error: "No profile found. Please complete your profile before tailoring a resume." },
        { status: 400 }
      );
    case "allowance_exhausted":
      return Response.json({ error: "allowance_exhausted" }, { status: 402 });
    case "tailor_failed":
      return Response.json(
        { error: "Failed to generate tailored resume. Please try again." },
        { status: 500 }
      );
  }
}
