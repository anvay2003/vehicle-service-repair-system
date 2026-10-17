import type { WorkOrderStatus } from "@prisma/client";

// Allowed transitions a technician may perform.
// AWAITING_APPROVAL -> APPROVED/REJECTED is the customer's action (US-06, Sprint 2).
export const TECH_TRANSITIONS: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
  CHECKED_IN: ["DIAGNOSIS"],
  DIAGNOSIS: ["AWAITING_APPROVAL"],
  APPROVED: ["IN_REPAIR"],
  IN_REPAIR: ["COMPLETED"],
};

export function canTechTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  return TECH_TRANSITIONS[from]?.includes(to) ?? false;
}