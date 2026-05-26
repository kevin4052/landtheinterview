# Land the Interview

A web app that tailors a user's resume to a specific job posting using AI, drawing on the user's persistent career profile.

## Language

**User Profile**:
The persistent record of a user's career data — name, contact email, work experience, education, and skills. Created at onboarding and editable at any time. The source of truth for all Tailor operations.
_Avoid_: resume, CV, profile data

**Work Experience**:
A single job entry within a User Profile — company, title, start/end dates, isCurrent flag, optional location, and bullet points.
_Avoid_: job, role, position

**Education**:
An academic entry within a User Profile — school, degree, field of study, and dates.
_Avoid_: degree, school record

**Skill Category**:
A named group of skills within a User Profile (e.g. "Languages", "Frameworks").
_Avoid_: skill set, skill group

**Resume**:
Serialized plain text produced from a User Profile, passed as input to a Tailor operation.
_Avoid_: CV, document, file, upload

**Job Posting**:
Raw text of a job description, submitted as input to a Tailor operation.
_Avoid_: Job description, listing, role

**Tailored Resume**:
AI-generated resume text that rewrites the Resume to match a specific Job Posting.
_Avoid_: Optimized resume, rewritten resume, output

**Tailor**:
The core operation — producing a Tailored Resume from the AI model given a Resume and Job Posting in a single call.
_Avoid_: Generate, optimize, process

**Tailor Log**:
A persisted DB record of a completed Tailor operation. Stores the serialized Resume text, Job Posting text, and Tailored Resume text for the user's history and internal audit.
_Avoid_: Record, history, result

## Tenancy & Billing

**Tenant**:
The isolated unit of data ownership in the system. One Tenant per User, created automatically when a User signs up via Clerk. Identified by a UUID that serves as the row-level security boundary across all tables.
_Avoid_: Account, organization, workspace

**Subscription Plan**:
The tier a Tenant is on — Free, Mid, or Pro. Determines the Tenant's Tailor Allowance and billing relationship with Stripe. Free Tenants have no Stripe relationship.
_Avoid_: Tier, level, package

**Tailor Allowance**:
The number of Tailor operations a Tenant may perform within their current period. Free: 5 lifetime. Mid: 20 per billing period. Pro: unlimited. Decremented atomically before a Tailor operation runs.
_Avoid_: Credits, ops, quota, limit

## Relationships

- A **User Profile** is serialized into a **Resume** text before being passed to a **Tailor** operation
- A **Tailor** operation takes one **Resume** and one **Job Posting** and produces one **Tailored Resume**
- A **Tailor Log** records the Resume text, Job Posting text, and Tailored Resume text of a completed **Tailor** operation
- A **Tenant** owns one **User Profile**, zero or more **Tailor Logs**, and one **Subscription Plan**
- A **Tailor** operation is only permitted if the Tenant's **Tailor Allowance** is not exhausted

## Example dialogue

> **Dev:** "When the user tailors, where does the Resume text come from?"
> **Domain expert:** "From their User Profile. We serialize it server-side — the Tailor prompt receives plain text exactly as before. The user never uploads a file."

> **Dev:** "What if the user updates their Profile between two Tailor operations — do old records become stale?"
> **Domain expert:** "No — the Tailor Log stores the serialized Resume text at the time of the operation. The Profile is the live source of truth; the Tailor Log is the audit trail."

## Flagged ambiguities

- "results" was used in the spec to mean both the `/results/[id]` route and the Tailored Resume text shown inline — resolved: Phase 3 shows the Tailored Resume inline on the dashboard; the `/dashboard/history/[id]` route is the detail page.
- "parse" was used to mean both an intermediate AI step and the internal extraction logic — resolved: there is no parse step; the Tailor operation processes plain text directly (ADR-0001).
- "resume" was used in Phase 1–2 to mean an uploaded file — resolved: in Phase 3 "Resume" refers to serialized Profile text. "Upload" and "file" are not part of domain language (ADR-0005).
