import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/profile", () => ({ getProfile: vi.fn() }));
vi.mock("@/lib/billing/allowance", () => ({ consumeAllowance: vi.fn() }));
vi.mock("@/lib/tailor/runTailor", () => ({ runTailor: vi.fn() }));
vi.mock("@/lib/db/tailor-log", () => ({ createTailorLog: vi.fn() }));

import { performTailor } from "./performTailor";
import { getProfile } from "@/lib/db/profile";
import { consumeAllowance } from "@/lib/billing/allowance";
import { runTailor } from "@/lib/tailor/runTailor";
import { createTailorLog } from "@/lib/db/tailor-log";

const fakeProfile = { name: "Ada" } as never;
const fakeResume = { name: "Ada", contact: [], sections: [] } as never;

function mockRunTailor(over: Partial<{ jobTitle: string | null; companyName: string | null }> = {}) {
  vi.mocked(runTailor).mockResolvedValue({
    resumeJson: fakeResume,
    resumeText: "RESUME TEXT",
    jobTitle: "Engineer",
    companyName: "Acme",
    ...over,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("performTailor", () => {
  it("invalid body → invalid_request, before any profile lookup or reserve", async () => {
    const result = await performTailor({});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_request");
    expect(getProfile).not.toHaveBeenCalled();
    expect(consumeAllowance).not.toHaveBeenCalled();
  });

  it("no profile → no_profile, no Allowance reserved", async () => {
    vi.mocked(getProfile).mockResolvedValue(null);

    const result = await performTailor({ jobText: "job" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no_profile");
    expect(consumeAllowance).not.toHaveBeenCalled();
  });

  it("allowance exhausted → allowance_exhausted, Tailor never runs", async () => {
    vi.mocked(getProfile).mockResolvedValue(fakeProfile);
    vi.mocked(consumeAllowance).mockResolvedValue({ allowed: false });

    const result = await performTailor({ jobText: "job" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("allowance_exhausted");
    expect(runTailor).not.toHaveBeenCalled();
  });

  it("success → ok + resume; commitLog writes one Tailor Log with the assembled title", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getProfile).mockResolvedValue(fakeProfile);
    vi.mocked(consumeAllowance).mockResolvedValue({ allowed: true, release });
    mockRunTailor();
    vi.mocked(createTailorLog).mockResolvedValue(undefined);

    const result = await performTailor({ jobText: "job posting" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resume).toBe(fakeResume);
    expect(release).not.toHaveBeenCalled();
    // The log is deferred — nothing written until the caller commits.
    expect(createTailorLog).not.toHaveBeenCalled();

    await result.commitLog();

    expect(createTailorLog).toHaveBeenCalledOnce();
    expect(createTailorLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeText: "RESUME TEXT",
        jobText: "job posting",
        outputText: JSON.stringify(fakeResume),
        title: "Engineer - Acme",
      })
    );
  });

  it("tailor throws → tailor_failed AND the Allowance is released", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getProfile).mockResolvedValue(fakeProfile);
    vi.mocked(consumeAllowance).mockResolvedValue({ allowed: true, release });
    vi.mocked(runTailor).mockRejectedValue(new Error("AI down"));

    const result = await performTailor({ jobText: "job posting" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("tailor_failed");
    expect(release).toHaveBeenCalledOnce();
  });

  it("commitLog swallows a DB write failure without throwing", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getProfile).mockResolvedValue(fakeProfile);
    vi.mocked(consumeAllowance).mockResolvedValue({ allowed: true, release });
    mockRunTailor({ jobTitle: null, companyName: null });
    vi.mocked(createTailorLog).mockRejectedValue(new Error("db down"));

    const result = await performTailor({ jobText: "job" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await expect(result.commitLog()).resolves.toBeUndefined();
  });
});
