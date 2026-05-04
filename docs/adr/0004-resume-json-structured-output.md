# ResumeJSON as the single structured output format

## Context

The Tailor operation previously instructed the model to return plain text. The model produced markdown regardless of the instruction (`**bold**`, `## Section`, `- bullet`), which appeared as raw characters in the `<pre>` display and broke the heuristic PDF generator. We need a contract between the AI output, the preview component, and the three PDF generators that is machine-readable and validates correctly.

## Decision

A `ResumeJSON` type is the single source of truth consumed by all downstream consumers: `ResumePreview`, `generateClassicPdf`, `generateModernPdf`, and `generateTwoColumnPdf`.

The schema is defined once in `lib/validators/resumeJson.schema.ts` using Zod. All types are derived from that schema via `z.infer`. The model is instructed via system prompt to return only a JSON object conforming to this schema — no prose outside the JSON object.

**Schema summary:**

- `ResumeJSON` — top-level object: `name`, `contact[]`, `summary?`, `sections[]`
- `Section` — `title`, `type` (SectionType enum), `entries[]`
- `Entry` — all optional: `heading`, `subheading`, `date`, `bullets[]`, `body`, `level`
- `SectionType` enum — `experience | education | skills | projects | certifications | languages | other`
- `ProficiencyLevel` enum — `native | fluent | professional | conversational | basic` — used only on language entries

## Alternatives considered

**Custom delimiters / structured plain text** — e.g. `===SECTION===` markers. Rejected: brittle to variations in model output and harder to validate programmatically.

**OpenAI-style function calling / tool use** — enforces schema at the API level. Not chosen here because the system prompt instruction approach is sufficient for this use case and avoids coupling the schema definition to Anthropic's tool schema format. Can be revisited if output reliability proves insufficient with real traffic.

**Per-section intermediate parse calls** — rejected in ADR-0001 for latency reasons. This decision is unaffected: the Tailor operation still passes raw text to the model in a single call; only the output format instruction is new.

## Consequences

- The PDF generators no longer contain heuristic text parsing — all layout decisions are driven by `section.type` and `entry` fields.
- `outputText` in the Tailor Log stores `JSON.stringify(resumeJson)`. Existing dev records (cleared on migration) stored plain text; no migration is needed for production because there are no active users at this phase.
- DOCX export is not yet updated to consume `ResumeJSON` directly; `resumeToText()` serializes the structured data back to plain text as an interim measure. This is a known limitation to be addressed when DOCX templates are in scope.
