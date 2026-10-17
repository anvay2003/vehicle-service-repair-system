import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }
  if (request.status !== "REQUESTED") {
    return NextResponse.json({ error: "Request is not awaiting check-in" }, { status: 409 });
  }

  const [workOrder] = await prisma.$transaction([
    prisma.workOrder.create({
      data: { serviceRequestId: request.id, status: "CHECKED_IN" },
    }),
    prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: "CHECKED_IN" },
    }),
  ]);
  return NextResponse.json(workOrder, { status: 201 });
}