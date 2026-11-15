export const ISSUES = [
  "Brakes squealing, grinding or soft pedal",
  "Engine won't start or stalls",
  "Check engine light is on",
  "Strange noises or vibration while driving",
  "Oil change or routine maintenance",
  "Battery or electrical problem",
  "A/C or heating not working",
  "Tire wear, flat tire or alignment",
  "Transmission or gear shifting problem",
  "Overheating or coolant leak",
] as const;

export const OTHER = "Other";

export function buildDescription(issues: string[], notes: string) {
  const parts: string[] = [];
  if (issues.length) parts.push(`Issues: ${issues.join("; ")}.`);
  if (notes.trim()) parts.push(`Notes: ${notes.trim()}`);
  return parts.join(" ");
}