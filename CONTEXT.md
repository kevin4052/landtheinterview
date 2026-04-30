# Land the Interview

A web app that accepts a user's resume and a job posting, then uses AI to produce a tailored resume optimized for that specific role.

## Language

**Resume**:
Raw text of a user's career document, submitted as input to a Tailor operation.
_Avoid_: CV, document, file

**Job Posting**:
Raw text of a job description, submitted as input to a Tailor operation.
_Avoid_: Job description, listing, role

**Tailored Resume**:
AI-generated resume text that rewrites the Resume to match a specific Job Posting.
_Avoid_: Optimized resume, rewritten resume, output

**Tailor**:
The core operation — streaming a Tailored Resume from the AI model given a Resume and Job Posting in a single call.
_Avoid_: Generate, optimize, process

**Tailor Log**:
A persisted DB record of a completed Tailor operation. Stores raw inputs and output for internal logging only — not user-facing in Phase 1.
_Avoid_: Record, history, result

## Relationships

- A **Tailor** operation takes one **Resume** and one **Job Posting** and produces one **Tailored Resume**
- A **Tailor Log** records the Resume text, Job Posting text, and Tailored Resume text of a completed **Tailor** operation

## Example dialogue

> **Dev:** "When the user submits, do we store the Resume separately before Tailoring?"
> **Domain expert:** "No — in Phase 1 there's no separate Resume record. The Resume text goes straight into the Tailor operation. Only the Tailor Log is persisted."

## Flagged ambiguities

- "results" was used in the spec to mean both the `/results/[id]` route and the Tailored Resume text shown inline — resolved: Phase 1 shows the Tailored Resume inline on the upload page; the results route is Phase 2.
- "parse" was used to mean both an intermediate AI step and the internal extraction logic — resolved: Phase 1 has no parse step; the Tailor operation processes raw text directly.
