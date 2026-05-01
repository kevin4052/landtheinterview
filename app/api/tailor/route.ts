import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { tailorResume } from "@/lib/ai/tailorResume";
import { TailorRequestSchema } from "@/lib/validators/tailor.schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Resume and job posting text are required" },
      { status: 400 }
    );
  }

  const { resumeText, jobText, inputFilename, inputFormat } = parsed.data;
  let fullOutput = "";

  try {
    const anthropicStream = tailorResume(resumeText, jobText);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullOutput += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    after(async () => {
      if (!fullOutput) return;
      try {
        await prisma.tailoredResume.create({
          data: {
            resumeText,
            jobText,
            outputText: fullOutput,
            inputFilename: inputFilename ?? null,
            inputFormat: inputFormat ?? "paste",
          },
        });
      } catch (err) {
        console.error("[tailor] DB write failed:", err);
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[tailor] AI call failed:", err);
    return Response.json(
      { error: "Failed to generate tailored resume. Please try again." },
      { status: 500 }
    );
  }
}
