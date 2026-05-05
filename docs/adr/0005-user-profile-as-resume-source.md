# User Profile as the Resume source of truth for Tailor operations

## Context

Phase 1–2 asked users to upload a resume file on each Tailor operation. The uploaded text was passed directly to the Tailor prompt and stored in the `TailoredResume` record. This works for a one-off demo but creates friction at scale: users must re-upload the same document every session, there is no structured representation of their career data, and the app cannot surface or edit that data over time.

Phase 3 introduces a persistent `UserProfile` — a structured DB record containing `WorkExperience`, `Education`, and `SkillCategory` entries — as the authoritative source of a user's career data. A pure serializer function converts this structured data into the plain-text Resume string that the Tailor prompt receives.

## Decision

`UserProfile` is the single source of truth for all Tailor operations. Resume file upload is removed. The flow is:

1. The user maintains their career data in a `UserProfile` (created at onboarding, editable at any time via `/dashboard/profile`).
2. Before a Tailor operation, `serializeProfileToResumeText(profile)` converts the structured profile into a plain-text Resume string.
3. That string is passed to the Tailor prompt as the Resume input — exactly as uploaded text was in Phase 1–2.

**ADR-0001 still holds**: the Tailor operation receives plain text in a single AI call with no parse intermediates. The serialization step is application logic, not an AI call.

## Alternatives considered

**Keep upload alongside Profile** — allow users to supply a one-off resume that overrides their Profile for a single Tailor operation. Rejected: adds a code path that undermines the Profile as source of truth, complicates the API contract, and introduces ambiguity about which input was used for a given `TailoredResume` record.

**Serialize directly to ResumeJSON** — pass a structured JSON object to the Tailor prompt instead of plain text. Rejected: the Tailor prompt requires natural-language input; `ResumeJSON` is an output format, not an input format (ADR-0004).

## Consequences

- The `resumeText` column in `TailoredResume` stores the serialized Profile text produced at the time of each Tailor operation, preserving an audit trail even if the Profile changes later.
- The `/upload` route is permanently redirected (308) to `/dashboard`. The upload page component is deleted.
- Users without a complete Profile cannot Tailor — the API returns a `400` and the onboarding middleware redirects incomplete users to `/onboarding` before they reach the dashboard.
- Existing Phase 1–2 `TailoredResume` records stored uploaded resume text in the same column; they are unaffected (no migration needed — no active users at this phase).
