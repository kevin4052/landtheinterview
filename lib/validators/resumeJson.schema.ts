import { z } from "zod";

export const ProficiencyLevelSchema = z.enum([
  "native",
  "fluent",
  "professional",
  "conversational",
  "basic",
]);

export const SectionTypeSchema = z.enum([
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "other",
]);

export const EntrySchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  date: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  body: z.string().optional(),
  level: ProficiencyLevelSchema.optional(),
});

export const SectionSchema = z.object({
  title: z.string(),
  type: SectionTypeSchema,
  entries: z.array(EntrySchema),
});

export const ResumeJSONSchema = z.object({
  name: z.string(),
  contact: z.array(z.string()),
  summary: z.string().optional(),
  sections: z.array(SectionSchema),
});

export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;
export type SectionType = z.infer<typeof SectionTypeSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Section = z.infer<typeof SectionSchema>;
export type ResumeJSON = z.infer<typeof ResumeJSONSchema>;
