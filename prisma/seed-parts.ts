import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTS = [
  { sku: "OF-100", name: "Oil filter", unitPriceCents: 1250, stock: 40 },
  { sku: "OIL-5W30", name: "Synthetic oil 5W-30 (1 qt)", unitPriceCents: 900, stock: 80 },
  { sku: "BP-FRONT", name: "Front brake pads (set)", unitPriceCents: 6400, stock: 15 },
  { sku: "BP-REAR", name: "Rear brake pads (set)", unitPriceCents: 5800, stock: 15 },
  { sku: "ROTOR", name: "Brake rotor (each)", unitPriceCents: 7200, stock: 12 },
  { sku: "AF-100", name: "Engine air filter", unitPriceCents: 1800, stock: 25 },
  { sku: "CF-100", name: "Cabin air filter", unitPriceCents: 1500, stock: 25 },
  { sku: "SPARK", name: "Spark plug (each)", unitPriceCents: 650, stock: 60 },
  { sku: "BAT-12V", name: "12V car battery", unitPriceCents: 13500, stock: 8 },
  { sku: "WIPER", name: "Wiper blades (pair)", unitPriceCents: 2200, stock: 20 },
  { sku: "COOLANT", name: "Coolant (1 gal)", unitPriceCents: 1900, stock: 20 },
  { sku: "BELT", name: "Serpentine belt", unitPriceCents: 3400, stock: 10 },
];

async function main() {
  for (const p of PARTS) {
    await prisma.part.upsert({
      where: { sku: p.sku },
      update: { name: p.name, unitPriceCents: p.unitPriceCents },
      create: p,
    });
  }
  console.log(`Seeded ${PARTS.length} parts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());