import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = [
    { name: "Test Customer", email: "customer@vsrms.test", role: "CUSTOMER" },
    { name: "Test Staff", email: "staff@vsrms.test", role: "STAFF" },
    { name: "Test Tech", email: "tech@vsrms.test", role: "TECHNICIAN" },
    { name: "Test Admin", email: "admin@vsrms.test", role: "ADMIN" },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }
}

main().finally(() => prisma.$disconnect());