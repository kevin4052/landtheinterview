# Land the Interview

A web app that takes your resume and a job posting, then uses AI to produce a tailored resume optimized for that specific role — streamed in real time.

## What it does

Paste your resume and a job posting. Click **Tailor My Resume**. The app rewrites your resume to match the role, incorporating relevant keywords, reordering experience by relevance, and strengthening bullet points — without fabricating anything. The tailored resume streams back token-by-token as it's generated.

## Tech stack

- **Next.js 16** (App Router)
- **Claude claude-opus-4-7** via the Anthropic SDK — adaptive thinking enabled, system prompt cached
- **Prisma 7** + **PostgreSQL** — every tailor operation is logged to a `TailoredResume` record
- **Tailwind CSS 4**
- **Zod 4** — request validation

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables — copy `.env.local` and fill in:

```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
```

3. Push the database schema:

```bash
npx prisma db push
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/upload`.

## Architecture

The core operation is a **Tailor**: raw resume text + raw job posting text → streaming tailored resume, logged to the DB on completion. There are no intermediate parse steps; Claude handles raw text directly in a single call (see [ADR 0001](docs/adr/0001-direct-tailor-no-parse-intermediates.md)).

The tailored resume streams inline on the upload page rather than navigating to a separate results route (see [ADR 0002](docs/adr/0002-stream-into-upload-page.md)).

```
/upload          — input form + streaming output (Phase 1 entry point)
lib/ai/          — tailorResume() streaming wrapper
lib/db/          — Prisma client singleton
lib/validators/  — Zod schema for /api/tailor request body
prisma/          — TailoredResume schema
```

## Phase 2 roadmap

- **Auth** — user accounts so tailoring history is tied to an identity
- **Resume history** — dashboard listing past tailor operations
- **`/results/[id]` route** — shareable deep-link to a specific tailored resume
- **Parse intermediates (optional)** — structured JSON extraction of resume + job posting before tailoring, if raw-text quality proves insufficient with real usage data
- **Resume file upload** — accept PDF/DOCX in addition to pasted text
