import { describe, it, expect } from "vitest";
import { canTechTransition } from "../../lib/workflow";

describe("canTechTransition (technician work-order state machine)", () => {
  it.each([
    ["CHECKED_IN", "DIAGNOSIS"],
    ["APPROVED", "IN_REPAIR"],
    ["IN_REPAIR", "COMPLETED"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTechTransition(from, to)).toBe(true);
  });

  it("does not allow DIAGNOSIS -> AWAITING_APPROVAL (only the estimate endpoint may do that)", () => {
    expect(canTechTransition("DIAGNOSIS", "AWAITING_APPROVAL")).toBe(false);
  });

  it("does not allow AWAITING_APPROVAL -> COMPLETED (customer decision required)", () => {
    expect(canTechTransition("AWAITING_APPROVAL", "COMPLETED")).toBe(false);
  });

  it("does not allow the technician to approve or reject", () => {
    expect(canTechTransition("AWAITING_APPROVAL", "APPROVED")).toBe(false);
    expect(canTechTransition("AWAITING_APPROVAL", "REJECTED")).toBe(false);
  });

  it("does not allow skipping steps", () => {
    expect(canTechTransition("CHECKED_IN", "IN_REPAIR")).toBe(false);
    expect(canTechTransition("DIAGNOSIS", "COMPLETED")).toBe(false);
  });

  it("does not allow moves out of closed states", () => {
    expect(canTechTransition("COMPLETED", "IN_REPAIR")).toBe(false);
    expect(canTechTransition("REJECTED", "APPROVED")).toBe(false);
  });
});
