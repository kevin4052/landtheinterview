export function assembleTailoredResumeTitle(
  jobTitle: string | null | undefined,
  companyName: string | null | undefined,
  createdAt: Date
): string {
  const title = jobTitle?.trim() || null;
  const company = companyName?.trim() || null;

  if (title && company) return `${title} - ${company}`;
  if (title) return title;
  if (company) return company;
  return `Resume - ${createdAt.toLocaleDateString()}`;
}
