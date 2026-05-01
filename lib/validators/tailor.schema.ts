import { z } from "zod";

export const TailorRequestSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required"),
  jobText: z.string().min(1, "Job posting text is required"),
  inputFilename: z.string().optional(),
  inputFormat: z.enum(["pdf", "docx", "txt", "paste"]).optional(),
});

export type TailorRequest = z.infer<typeof TailorRequestSchema>;
