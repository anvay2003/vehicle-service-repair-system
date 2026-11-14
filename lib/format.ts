export const pretty = (s: string) => s.replaceAll("_", " ");
export const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });