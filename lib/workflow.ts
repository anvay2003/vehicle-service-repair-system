import type { WorkOrderStatus } from "@prisma/client";

// Technician transitions. DIAGNOSIS -> AWAITING_APPROVAL happens only by submitting an
// estimate (POST /api/work-orders/[id]/estimate). AWAITING_APPROVAL -> APPROVED/REJECTED
// is the customer's decision (US-06).
export const TECH_TRANSITIONS: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
  CHECKED_IN: ["DIAGNOSIS"],
  APPROVED: ["IN_REPAIR"],
  IN_REPAIR: ["COMPLETED"],
};

export function canTechTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  return TECH_TRANSITIONS[from]?.includes(to) ?? false;
}