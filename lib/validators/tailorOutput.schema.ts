import { z } from "zod";
import { ResumeJSONSchema } from "./resumeJson.schema";

export const TailorOutputSchema = z.object({
  resume: ResumeJSONSchema,
  jobTitle: z.string().nullable(),
  companyName: z.string().nullable(),
});

export type TailorOutput = z.infer<typeof TailorOutputSchema>;
