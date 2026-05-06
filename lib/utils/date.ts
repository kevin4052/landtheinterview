export function parseMonthDate(s: string): Date {
  return new Date(/^\d{4}-\d{2}$/.test(s) ? s + "-01" : s);
}
