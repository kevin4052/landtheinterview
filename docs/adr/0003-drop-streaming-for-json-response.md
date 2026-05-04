# Drop streaming in favour of structured JSON response — supersedes ADR-0002

ADR-0002 established streaming the Tailored Resume inline on the upload page to avoid the coordination cost of waiting for a saved ID before navigating. That tradeoff no longer holds: the model consistently returns markdown-formatted text regardless of plain-text instructions, and the PDF generator's heuristic line-by-line parsing of that text produces inconsistent layouts.

Switching to a single non-streaming `messages.create` call solves both problems. The model is instructed to return a validated `ResumeJSON` object (see ADR-0004). The API route waits for the full response, validates the JSON, and returns it to the client in a single `application/json` payload. The upload page receives the complete object and renders it immediately via the `ResumePreview` component.

**Tradeoffs accepted:**

- *Perceived latency increases.* The user sees a spinner for the full model round-trip (typically 10–30 s with extended thinking) rather than text appearing incrementally. This is judged acceptable because the structured preview — free of markdown artefacts and styled as a real resume — is more useful than raw streaming text.
- *Streaming is not recoverable mid-stream.* A network drop during a streaming response loses partial output; a non-streaming call either succeeds or fails cleanly, making retry logic simpler.

**What is unchanged:**

- ADR-0001 (pass raw Resume and Job Posting text directly to the model with no parse intermediates) is unaffected. Only the output format instruction changes.
- The `/results/[id]` route remains Phase 2; the Tailored Resume is still shown inline on the upload page.
