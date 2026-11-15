import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e0e7ff`;

const TECHS = [
  { name: "Marcus Reyes", email: "marcus@vsrms.test", password: "Marcus-Torque-26" },
  { name: "Priya Nair", email: "priya@vsrms.test", password: "Priya-Gearbox-26" },
  { name: "Daniel Okafor", email: "daniel@vsrms.test", password: "Daniel-Piston-26" },
  { name: "Sofia Lindqvist", email: "sofia@vsrms.test", password: "Sofia-Camshaft-26" },
];

async function main() {
  for (const t of TECHS) {
    const passwordHash = await bcrypt.hash(t.password, 10);
    await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, role: "TECHNICIAN", avatarUrl: avatar(t.name) },
      create: { name: t.name, email: t.email, passwordHash, role: "TECHNICIAN", avatarUrl: avatar(t.name) },
    });
  }
  await prisma.user.updateMany({
    where: { email: "tech@vsrms.test" },
    data: { avatarUrl: avatar("Test Tech") },
  });
  console.log(`Seeded ${TECHS.length} technicians`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());