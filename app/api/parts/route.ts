import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { error } = await requireRole("TECHNICIAN", "STAFF", "ADMIN");
  if (error) return error;
  const parts = await prisma.part.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(parts);
}