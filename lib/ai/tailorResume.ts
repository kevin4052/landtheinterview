import Anthropic from "@anthropic-ai/sdk";
import {
  ResumeJSONSchema,
  type ResumeJSON,
} from "@/lib/validators/resumeJson.schema";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert resume optimizer.

Rewrite the resume below to match the job posting. Return ONLY a valid JSON object — no prose, no markdown, no explanation outside the JSON. The response must begin with { and end with }.

The JSON must conform to this schema:

{
  "name": string,
  "contact": string[],
  "summary": string,
  "sections": [
    {
      "title": string,
      "type": "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "other",
      "entries": [
        {
          "heading": string,
          "subheading": string,
          "date": string,
          "bullets": string[],
          "body": string,
          "level": "native" | "fluent" | "professional" | "conversational" | "basic"
        }
      ]
    }
  ]
}

Field rules:
- "contact": each contact item (email, phone, LinkedIn, location) as a separate string
- "summary": omit the field entirely if the original resume has no summary
- All entry fields are optional — only include fields that have content
- "bullets": bullet text without any leading dash or bullet character
- "level": only for language entries; omit for all other entry types
- "body": for prose entries instead of bullets (e.g. a skills group listed as a sentence)

Tailoring rules:
- Keep it truthful — do not fabricate experience or skills
- Prioritize experience most relevant to the role
- Naturally incorporate keywords from the job posting
- Strengthen bullet points with measurable impact where possible
- Preserve the original resume's section structure`;

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }

  throw new Error("Could not extract JSON from model response");
}

export async function tailorResume(
  resumeText: string,
  jobText: string
): Promise<ResumeJSON> {
  const response = await client.messages.create({
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

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in model response");
  }

  const raw = extractJson(textBlock.text);
  const parsed = ResumeJSONSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Model returned invalid ResumeJSON: ${parsed.error.message}`
    );
  }
  return parsed.data;
}
