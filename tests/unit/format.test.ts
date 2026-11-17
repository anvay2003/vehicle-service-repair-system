import { describe, it, expect } from "vitest";
import { pretty, money, vehicleLabel, invoiceNumber } from "../../lib/format";

describe("format helpers", () => {
  it("pretty replaces underscores", () => {
    expect(pretty("AWAITING_APPROVAL")).toBe("AWAITING APPROVAL");
  });
  it("money formats integer cents as US dollars", () => {
    expect(money(18900)).toBe("$189.00");
    expect(money(1250)).toBe("$12.50");
    expect(money(0)).toBe("$0.00");
  });
  it("vehicleLabel joins year, make and model", () => {
    expect(vehicleLabel({ year: 2019, make: "Toyota", model: "Camry" })).toBe("2019 Toyota Camry");
  });
  it("invoiceNumber zero-pads to four digits", () => {
    expect(invoiceNumber(7)).toBe("INV-0007");
    expect(invoiceNumber(12345)).toBe("INV-12345");
  });
});
