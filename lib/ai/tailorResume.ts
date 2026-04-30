import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert resume optimizer.

Rewrite the resume below to match the job posting.

Rules:
- Keep it truthful — do not fabricate experience or skills
- Prioritize and reorder experience most relevant to the role
- Naturally incorporate keywords from the job posting
- Strengthen bullet points with measurable impact where possible
- Preserve the original resume's section structure and formatting

Return ONLY the tailored resume text, nothing else.`;

export function tailorResume(resumeText: string, jobText: string) {
  return client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nJob Posting:\n${jobText}`,
      },
    ],
  });
}
