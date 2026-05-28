# Land the Interview

A web app that tailors a user's resume to a specific job posting using AI, drawing on their persistent career profile.

## What it does

Users build a **User Profile** (work experience, education, skills) during onboarding. On the dashboard, they paste a **Job Posting**. The app serializes their profile into a **Resume** text, passes it to Claude with the job posting in a single call, and returns a **Tailored Resume** as structured JSON. The result renders as a styled preview and is downloadable as PDF or DOCX in three layout templates.

Every Tailor operation is recorded as a **Tailor Log** entry visible in the dashboard history. Each user is a **Tenant** — a single isolated data owner enforced at the database layer by Postgres row-level security, not application code.

## Tech stack

| Concern | Tool |
|---------|------|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk 7 |
| AI | Claude claude-opus-4-7 via Anthropic SDK 0.91 — adaptive thinking, prompt caching |
| Database | Drizzle ORM 0.45 + Neon (serverless HTTP driver) |
| RLS / multi-tenancy | Neon Auth — Clerk JWT passed per-request; `crudPolicy` on every table |
| Billing | Stripe 22 — Free / Mid / Pro plans; checkout + webhook handlers |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 |
| PDF export | `@react-pdf/renderer` 4.5 |
| DOCX export | `docx` 9.6 |
| Tests | Vitest 4 |

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables — copy `.env.local.example` and fill in:

```
# Neon — two connection strings for the same DB
DATABASE_URL=postgresql://...              # admin/superuser role (Clerk webhook, Stripe webhook)
DATABASE_AUTHENTICATED_URL=postgresql://... # app_authenticated role (all RLS-scoped queries)

ANTHROPIC_API_KEY=sk-ant-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...            # Svix signing secret for user.created events

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MID_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

3. Apply Drizzle migrations:

```bash
npx drizzle-kit migrate
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users see the landing page. After signing up via Clerk, users are routed through a 4-step onboarding form before reaching the dashboard.

## Architecture

Domain vocabulary is in [`CONTEXT.md`](CONTEXT.md). Key architectural decisions are recorded in [`docs/adr/`](docs/adr/).

### Multi-tenancy and RLS

Every database table except `tenants` carries a `tenant_id` column. Each table has a `crudPolicy` that compares `tenant_id` against the Tenant owned by `auth.user_id()` — a function Neon Auth resolves from the Clerk JWT embedded in each connection. The JWT is fetched via the `jwt-neon_rls` Clerk template and forwarded through `DATABASE_AUTHENTICATED_URL`.

Two Drizzle clients exist:

- **`getDb()` (`lib/db/client.ts`)** — JWT-scoped, used by all user-facing API routes. Requires an authenticated Clerk session. RLS enforces that queries only see the calling user's rows.
- **`getAdminDb()` (`lib/db/admin.ts`)** — superuser, singleton, no RLS. Used only by the Clerk `user.created` webhook (tenant provisioning) and Stripe webhook handlers (plan updates).

See [ADR-0006](docs/adr/0006-drizzle-neon-replace-prisma.md) (why Drizzle replaced Prisma) and [ADR-0007](docs/adr/0007-neon-auth-jwt-rls.md) (why JWT-native RLS instead of `SET LOCAL`).

### Billing

Tenants have three plans: `free`, `mid`, `pro`. `consumeAllowance()` in `lib/billing/allowance.ts` decrements the Tailor Allowance atomically on each Tailor request:

| Plan | Allowance |
|------|-----------|
| Free | 5 lifetime ops |
| Mid | 20 ops per 30-day period (self-healing inline reset; see ADR-0008) |
| Pro | Unlimited |

Stripe lifecycle events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) are handled in `lib/billing/stripe-events.ts` and dispatched by `POST /api/webhooks/stripe`. Tenant provisioning (inserting a new `tenants` row) happens in `POST /api/webhooks/clerk` on the `user.created` event.

### Module layout

```
lib/
├── ai/
│   └── tailorResume.ts          — Anthropic SDK call; returns validated TailorOutput
├── billing/
│   ├── allowance.ts             — consumeAllowance: atomic decrement with plan-specific caps
│   └── stripe-events.ts        — handleCheckoutCompleted / handleSubscriptionUpdated / handleSubscriptionDeleted / handlePaymentFailed
├── db/
│   ├── client.ts                — getDb(authToken?): JWT-scoped Neon connection (RLS enforced)
│   ├── admin.ts                 — getAdminDb(): superuser singleton (webhook routes only)
│   ├── schema.ts                — Drizzle schema: tenants + child tables with crudPolicy RLS
│   ├── profile.ts               — User Profile CRUD (FullProfile type exported here)
│   └── tailor-log.ts            — Tailor Log queries: create, paginated list, detail, title update
├── profile/
│   └── profileSection.ts       — defineSection factory: create/update/delete for all Profile Section kinds
├── stripe/
│   └── client.ts                — getStripe() singleton
├── tailor/
│   └── runTailor.ts             — Core Tailor operation: Profile → serialize → allowance check → AI → TailorOutput
├── serializers/
│   └── profileSerializer.ts     — serializeProfileToResumeText: FullProfile → plain-text Resume
├── validators/
│   ├── resumeJson.schema.ts     — ResumeJSON Zod schema; source of truth for all consumers
│   ├── tailor.schema.ts         — TailorRequest input schema
│   └── tailorOutput.schema.ts   — TailorOutput schema (resume + jobTitle + companyName)
├── generators/
│   ├── resumeFile.ts            — generateResumeFile: dispatches to PDF or DOCX based on format
│   ├── generatePdf.ts           — Classic, Modern, Two-Column PDF templates (react-pdf)
│   └── generateDocx.ts          — Classic, Modern, Two-Column DOCX templates (docx)
├── utils/
│   ├── entryRenderData.ts       — extractEntryRenderData: Entry + SectionType → tagged union
│   ├── assembleTailoredResumeTitle.ts
│   └── date.ts
└── proxy/
    └── onboarding-guard.ts      — needsOnboardingRedirect pure function (wired in proxy.ts)
```

### API routes

```
app/api/
├── tailor/route.ts              — POST: run Tailor (allowance check → AI → log)
├── download/route.ts            — POST: export ResumeJSON as PDF or DOCX
├── onboarding/route.ts          — POST: save initial User Profile
├── parse-resume/route.ts        — POST: parse uploaded resume file
├── profile/route.ts             — GET: fetch FullProfile
├── profile/[kind]/route.ts      — POST: create a Profile Section
├── profile/[kind]/[id]/route.ts — PATCH / DELETE: update or delete a Profile Section
├── resumes/[id]/route.ts        — GET / PATCH: fetch or rename a Tailor Log entry
├── checkout/route.ts            — POST: create Stripe Checkout session
└── webhooks/
    ├── clerk/route.ts           — POST: handle user.created → provision tenant
    └── stripe/route.ts          — POST: handle subscription lifecycle events
```

### Key flows

**Tailor operation** (`POST /api/tailor`):
1. Auth check (Clerk)
2. `consumeAllowance()` — atomic decrement; returns 403 if exhausted
3. Fetch `FullProfile` via `lib/db/profile`
4. `runTailor(profile, jobText)` — serializes profile, calls AI, validates output
5. Return `ResumeJSON` to client immediately
6. Fire-and-forget: persist `TailorLog` via `lib/db/tailor-log`

**Profile Section CRUD** (`POST|PATCH|DELETE /api/profile/[kind]/...`):
- `kind` is one of `work-experience`, `education`, `skill-categories`
- `profileSection.ts` uses SQL subqueries to resolve `tenant_id` and `profile_id` from `auth.user_id()` at insert time — no application-level ownership lookup needed
- RLS independently rejects any row that doesn't belong to the caller on update/delete

**Export** (`POST /api/download`):
- Client sends `{ resume: ResumeJSON, format, template }`
- `generateResumeFile` dispatches to `generatePdf` or `generateDocx`
- `extractEntryRenderData` is the shared rendering decision layer — all generators and the preview component use it

**Tenant provisioning** (`POST /api/webhooks/clerk`):
- Svix signature verified; `user.created` events insert a new `tenants` row via `getAdminDb()`

**Subscription lifecycle** (`POST /api/webhooks/stripe`):
- `checkout.session.completed` → sets plan + Stripe IDs on tenant
- `customer.subscription.updated` → updates plan + `current_period_end`
- `customer.subscription.deleted` / `invoice.payment_failed` → downgrades tenant to `free`

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

Tests cover: `ResumeJSON` schema validation, `TailorOutput` schema, profile serializer, title assembly, onboarding guard, PDF generator structure, Tailor Allowance logic, and Stripe event handlers.
