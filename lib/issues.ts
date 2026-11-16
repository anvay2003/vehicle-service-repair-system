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
export const DIAGNOSES = [
  "Brake pads worn / need replacement",
  "Brake rotors warped or scored",
  "Oil is dirty / due for change",
  "Battery weak or failing",
  "Alternator or charging system fault",
  "Spark plugs or ignition coil faulty",
  "Air filter clogged",
  "Coolant leak / thermostat or radiator fault",
  "Worn belt or hose",
  "Tires worn or misaligned",
  "Suspension components worn (struts, bushings)",
  "A/C refrigerant low or compressor fault",
  "Transmission fluid low or shifting fault",
  "Sensor or electrical fault (codes read)",
] as const;

export function buildDiagnosis(findings: string[], notes: string) {
  const parts: string[] = [];
  if (findings.length) parts.push(`Findings: ${findings.join("; ")}.`);
  if (notes.trim()) parts.push(`Notes: ${notes.trim()}`);
  return parts.join(" ");
}
