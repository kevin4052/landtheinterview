# Skip parse intermediates — tailor from raw text directly

The spec called for two intermediate AI calls (parse resume → structured JSON, parse job → structured JSON) before the tailor step. We skip these in Phase 1 and pass raw Resume and Job Posting text directly to the Tailor prompt in a single AI call. The parse steps add 5–10s of latency before the stream starts and two extra failure points, while modern Claude models handle raw text well. If output quality proves insufficient, parse intermediates can be added in Phase 2 with real usage data to justify the tradeoff.
