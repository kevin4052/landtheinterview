"use client";

import { Fragment, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";

type WorkExp = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  bullets: string;
};

type SkillCat = {
  categoryName: string;
  skills: string[];
};

type Edu = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

function emptyWorkExp(): WorkExp {
  return { company: "", title: "", startDate: "", endDate: "", isCurrent: false, location: "", bullets: "" };
}

function emptySkillCat(): SkillCat {
  return { categoryName: "", skills: [] };
}

function emptyEdu(): Edu {
  return { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", isCurrent: false };
}

const STEP_LABELS = ["Personal Info", "Work Experience", "Skills", "Education"];

const inputCls =
  "w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelCls = "block text-sm font-medium text-foreground mb-1";
const primaryBtn =
  "bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const ghostBtn =
  "border border-neutral-300 text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition-colors";

export function OnboardingForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const [workExps, setWorkExps] = useState<WorkExp[]>([]);
  const [wDraft, setWDraft] = useState<WorkExp>(emptyWorkExp());

  const [skillCats, setSkillCats] = useState<SkillCat[]>([]);
  const [sDraft, setSDraft] = useState<SkillCat>(emptySkillCat());
  const [skillInput, setSkillInput] = useState("");

  const [educations, setEducations] = useState<Edu[]>([]);
  const [eDraft, setEDraft] = useState<Edu>(emptyEdu());

  const canAddWork = wDraft.company.trim() && wDraft.title.trim() && wDraft.startDate;
  const canAddCat = sDraft.categoryName.trim() && sDraft.skills.length > 0;
  const canAddEdu = eDraft.school.trim() && eDraft.degree.trim() && eDraft.fieldOfStudy.trim() && eDraft.startDate;

  const addWorkExp = () => {
    if (!canAddWork) return;
    setWorkExps((p) => [...p, wDraft]);
    setWDraft(emptyWorkExp());
  };

  const addSkillToCategory = (raw: string) => {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;
    setSDraft((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkillToCategory(skillInput);
    }
  };

  const addSkillCat = () => {
    if (!canAddCat) return;
    setSkillCats((p) => [...p, sDraft]);
    setSDraft(emptySkillCat());
    setSkillInput("");
  };

  const addEdu = () => {
    if (!canAddEdu) return;
    setEducations((p) => [...p, eDraft]);
    setEDraft(emptyEdu());
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          workExperience: workExps.map((e) => ({
            company: e.company,
            title: e.title,
            startDate: e.startDate,
            endDate: e.isCurrent ? undefined : e.endDate || undefined,
            isCurrent: e.isCurrent,
            location: e.location || undefined,
            bullets: e.bullets
              .split("\n")
              .map((b) => b.trim())
              .filter(Boolean),
          })),
          skillCategories: skillCats.map((c) => ({
            categoryName: c.categoryName,
            skills: c.skills,
          })),
          education: educations.map((edu) => ({
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: edu.isCurrent ? undefined : edu.endDate || undefined,
            isCurrent: edu.isCurrent,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to create profile");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl w-full">
      {/* Progress indicator */}
      <div className="flex items-start mb-8">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num < step;
          const active = num === step;
          return (
            <Fragment key={num}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    done
                      ? "bg-primary text-white"
                      : active
                      ? "border-2 border-primary text-primary bg-white"
                      : "border-2 border-neutral-300 text-neutral-400 bg-white"
                  }`}
                >
                  {done ? "✓" : num}
                </div>
                <span
                  className={`text-xs text-center w-16 ${
                    active ? "text-primary font-medium" : "text-neutral-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-4 mx-1 transition-colors ${
                    done ? "bg-primary" : "bg-neutral-200"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your info</h2>
            <div>
              <label className={labelCls}>Full name</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className={labelCls}>Contact email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Work experience</h2>
            <p className="text-sm text-neutral-500">Add at least one position.</p>

            {workExps.length > 0 && (
              <ul className="space-y-2">
                {workExps.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 border border-neutral-200 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {e.title} · {e.company}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {e.startDate} — {e.isCurrent ? "Present" : e.endDate || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => setWorkExps((p) => p.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-red-500 text-xs shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border border-dashed border-neutral-300 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Company</label>
                  <input
                    className={inputCls}
                    value={wDraft.company}
                    onChange={(e) => setWDraft((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    className={inputCls}
                    value={wDraft.title}
                    onChange={(e) => setWDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start date</label>
                  <input
                    type="month"
                    className={inputCls}
                    value={wDraft.startDate}
                    onChange={(e) => setWDraft((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>End date</label>
                  <input
                    type="month"
                    className={inputCls}
                    value={wDraft.endDate}
                    disabled={wDraft.isCurrent}
                    onChange={(e) => setWDraft((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wDraft.isCurrent}
                  onChange={(e) =>
                    setWDraft((p) => ({ ...p, isCurrent: e.target.checked, endDate: "" }))
                  }
                  className="accent-primary"
                />
                I currently work here
              </label>
              <div>
                <label className={labelCls}>Location (optional)</label>
                <input
                  className={inputCls}
                  value={wDraft.location}
                  onChange={(e) => setWDraft((p) => ({ ...p, location: e.target.value }))}
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className={labelCls}>Bullet points (one per line, optional)</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={wDraft.bullets}
                  onChange={(e) => setWDraft((p) => ({ ...p, bullets: e.target.value }))}
                  placeholder="Shipped new checkout flow that increased conversions by 12%"
                />
              </div>
              <button
                onClick={addWorkExp}
                disabled={!canAddWork}
                className="w-full border border-primary text-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Add entry
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Skills</h2>
            <p className="text-sm text-neutral-500">
              Group your skills by category (e.g. Languages, Frameworks, Tools).
            </p>

            {skillCats.length > 0 && (
              <ul className="space-y-2">
                {skillCats.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 border border-neutral-200 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.categoryName}</p>
                      <p className="text-xs text-neutral-500">{c.skills.join(", ")}</p>
                    </div>
                    <button
                      onClick={() => setSkillCats((p) => p.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-red-500 text-xs shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border border-dashed border-neutral-300 rounded-lg p-4 space-y-3">
              <div>
                <label className={labelCls}>Category name</label>
                <input
                  className={inputCls}
                  value={sDraft.categoryName}
                  onChange={(e) => setSDraft((p) => ({ ...p, categoryName: e.target.value }))}
                  placeholder="Languages"
                />
              </div>
              <div>
                <label className={labelCls}>Skills</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sDraft.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5"
                    >
                      {skill}
                      <button
                        onClick={() =>
                          setSDraft((p) => ({
                            ...p,
                            skills: p.skills.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="hover:text-primary-hover"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  className={inputCls}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => addSkillToCategory(skillInput)}
                  placeholder="Type a skill and press Enter"
                />
                <p className="text-xs text-neutral-400 mt-1">Press Enter or comma to add a skill</p>
              </div>
              <button
                onClick={addSkillCat}
                disabled={!canAddCat}
                className="w-full border border-primary text-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Add category
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Education</h2>
            <p className="text-sm text-neutral-500">Add your educational background.</p>

            {educations.length > 0 && (
              <ul className="space-y-2">
                {educations.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 border border-neutral-200 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {e.degree} in {e.fieldOfStudy}
                      </p>
                      <p className="text-xs text-neutral-500">{e.school}</p>
                    </div>
                    <button
                      onClick={() => setEducations((p) => p.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-red-500 text-xs shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border border-dashed border-neutral-300 rounded-lg p-4 space-y-3">
              <div>
                <label className={labelCls}>School</label>
                <input
                  className={inputCls}
                  value={eDraft.school}
                  onChange={(e) => setEDraft((p) => ({ ...p, school: e.target.value }))}
                  placeholder="University of Texas"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Degree</label>
                  <input
                    className={inputCls}
                    value={eDraft.degree}
                    onChange={(e) => setEDraft((p) => ({ ...p, degree: e.target.value }))}
                    placeholder="B.S."
                  />
                </div>
                <div>
                  <label className={labelCls}>Field of study</label>
                  <input
                    className={inputCls}
                    value={eDraft.fieldOfStudy}
                    onChange={(e) => setEDraft((p) => ({ ...p, fieldOfStudy: e.target.value }))}
                    placeholder="Computer Science"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start date</label>
                  <input
                    type="month"
                    className={inputCls}
                    value={eDraft.startDate}
                    onChange={(e) => setEDraft((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>End date</label>
                  <input
                    type="month"
                    className={inputCls}
                    value={eDraft.endDate}
                    disabled={eDraft.isCurrent}
                    onChange={(e) => setEDraft((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eDraft.isCurrent}
                  onChange={(e) =>
                    setEDraft((p) => ({ ...p, isCurrent: e.target.checked, endDate: "" }))
                  }
                  className="accent-primary"
                />
                Currently enrolled
              </label>
              <button
                onClick={addEdu}
                disabled={!canAddEdu}
                className="w-full border border-primary text-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Add entry
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className={ghostBtn}>
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 3 && (
              <button onClick={() => setStep(4)} className={ghostBtn}>
                Skip for now
              </button>
            )}
            {step === 4 && (
              <button onClick={submit} disabled={submitting} className={ghostBtn}>
                {submitting ? "Saving…" : "Skip for now"}
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && (!name.trim() || !email.trim())) ||
                  (step === 2 && workExps.length === 0)
                }
                className={primaryBtn}
              >
                Next
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className={primaryBtn}>
                {submitting ? "Saving…" : "Complete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
