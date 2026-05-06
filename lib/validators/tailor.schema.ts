import { z } from "zod";

export const TailorRequestSchema = z.object({
  jobText: z.string().min(1, "Job posting text is required"),
});

export type TailorRequest = z.infer<typeof TailorRequestSchema>;
