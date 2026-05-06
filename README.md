# Land the Interview

A web app that tailors a user's resume to a specific job posting using AI, drawing on their persistent career profile.

## What it does

Users build a **User Profile** (work experience, education, skills) during onboarding. On the dashboard, they paste a **Job Posting**. The app serializes their profile into a **Resume** text, passes it to Claude with the job posting in a single call, and returns a **Tailored Resume** as structured JSON. The result renders as a styled preview and is downloadable as PDF or DOCX in three layout templates.

Every Tailor operation is recorded as a **Tailor Log** entry visible in the dashboard history.

## Tech stack

| Concern | Tool |
|---------|------|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| AI | Claude claude-opus-4-7 via Anthropic SDK — adaptive thinking, prompt caching |
| Database | Prisma 7 + PostgreSQL |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 |
| PDF export | `@react-pdf/renderer` |
| DOCX export | `docx` |
| Tests | Vitest |

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables — copy `.env.local.example` and fill in:

```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

3. Push the database schema:

```bash
npx prisma db push
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users see the landing page. After signing up via Clerk, users are routed through a 4-step onboarding form before reaching the dashboard.

## Architecture

Domain vocabulary is in [`CONTEXT.md`](CONTEXT.md). Key architectural decisions are recorded in [`docs/adr/`](docs/adr/).

### Module layout

```
lib/
├── ai/
│   └── tailorResume.ts          — Anthropic SDK call; returns validated TailorOutput
├── db/
│   ├── prisma.ts                — Prisma client singleton
│   ├── profile.ts               — User Profile CRUD (FullProfile type exported here)
│   └── tailor-log.ts            — Tailor Log queries: create, paginated list, detail, title update
├── tailor/
│   └── runTailor.ts             — Core Tailor operation: Profile → serialize → AI → TailorOutput
├── serializers/
│   └── profileSerializer.ts     — serializeProfileToResumeText: FullProfile → plain-text Resume
├── validators/
│   ├── resumeJson.schema.ts     — ResumeJSON Zod schema; source of truth for all consumers
│   ├── tailor.schema.ts         — TailorRequest input schema
│   └── tailorOutput.schema.ts   — TailorOutput schema (resume + jobTitle + companyName)
├── generators/
│   ├── generatePdf.ts           — Classic, Modern, Two-Column PDF templates (react-pdf)
│   └── generateDocx.ts          — Classic, Modern, Two-Column DOCX templates (docx)
├── utils/
│   ├── entryRenderData.ts       — extractEntryRenderData: Entry + SectionType → tagged union
│   ├── assembleTailoredResumeTitle.ts
│   └── date.ts
└── proxy/
    └── onboarding-guard.ts      — needsOnboardingRedirect pure function (wired in proxy.ts)
```

### Key flows

**Tailor operation** (`POST /api/tailor`):
1. Auth check (Clerk)
2. Fetch `FullProfile` via `lib/db/profile`
3. `runTailor(profile, jobText)` — serializes profile, calls AI, validates output
4. Return `ResumeJSON` to client immediately
5. Fire-and-forget: persist `TailorLog` via `lib/db/tailor-log`

**Export** (`POST /api/download`):
- Client sends `{ resume: ResumeJSON, format, template }`
- `generateClassicPdf` / `generateModernPdf` / `generateTwoColumnPdf` consume `ResumeJSON` directly via `extractEntryRenderData`
- `generateDocx` does the same for DOCX — no text serialization round-trip

**Onboarding guard** (`proxy.ts`):
- `clerkMiddleware` checks profile completeness for all `/dashboard` routes
- Incomplete users are redirected to `/onboarding` before any dashboard page renders

### ResumeJSON

`ResumeJSONSchema` in `lib/validators/resumeJson.schema.ts` is the single contract between the AI output and all downstream consumers: `ResumePreview`, the three PDF generators, and the three DOCX generators. `extractEntryRenderData` in `lib/utils/entryRenderData.ts` is the shared rendering decision layer — classifies each entry as `language`, `skill`, or `default` — used by all generators and the preview component.

See [ADR-0004](docs/adr/0004-resume-json-structured-output.md) for why this schema exists and [ADR-0005](docs/adr/0005-user-profile-as-resume-source.md) for why file upload was removed.

## Running tests

```bash
npx vitest run
```

Tests cover: `ResumeJSON` schema validation, `TailorOutput` schema, profile serializer, title assembly, onboarding guard, and PDF generator structure.
