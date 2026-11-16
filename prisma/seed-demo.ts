import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const DEMO_DOMAIN = "@demo.vsrms.test";
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
let vinCounter = 0;
const demoVin = () => `VSRMSDEMO${String(++vinCounter).padStart(8, "0")}`; // 17 chars, obviously fake

const CUSTOMERS = [
  { name: "Jordan Whitfield", vehicles: [{ make: "Honda", model: "Civic", year: 2018, mileage: 61250 }, { make: "Toyota", model: "RAV4", year: 2020, mileage: 38900 }] },
  { name: "Hannah Brooks", vehicles: [{ make: "Ford", model: "F-150", year: 2016, mileage: 97400 }] },
  { name: "Tomás Herrera", vehicles: [{ make: "Subaru", model: "Outback", year: 2019, mileage: 52300 }] },
  { name: "Mei Tanaka", vehicles: [{ make: "Hyundai", model: "Elantra", year: 2021, mileage: 24100 }] },
  { name: "Samuel Adeyemi", vehicles: [{ make: "Chevrolet", model: "Malibu", year: 2015, mileage: 110800 }] },
  { name: "Rachel Cohen", vehicles: [{ make: "Volkswagen", model: "Jetta", year: 2017, mileage: 84500 }] },
];

const TECH = { marcus: "marcus@vsrms.test", priya: "priya@vsrms.test", daniel: "daniel@vsrms.test", sofia: "sofia@vsrms.test" };

type Job = {
  c: number; v: number; tech: keyof typeof TECH; days: number;
  description: string; diagnosis: string;
  items: { description: string; amountCents: number }[];
  rating: number; comment: string | null;
};

const JOBS: Job[] = [
  { c: 0, v: 0, tech: "marcus", days: 34, description: "Issues: Brakes squealing, grinding or soft pedal.", diagnosis: "Findings: Brake pads worn / need replacement. Notes: Rotors within spec.", items: [{ description: "Front brake pads (set) and labor", amountCents: 24500 }], rating: 5, comment: "Marcus explained exactly what was wrong with the brakes and the price matched the estimate. Car was ready the same afternoon." },
  { c: 1, v: 0, tech: "daniel", days: 29, description: "Issues: Engine won't start or stalls; Battery or electrical problem.", diagnosis: "Findings: Battery weak or failing. Notes: Terminals corroded, cleaned.", items: [{ description: "12V battery replacement", amountCents: 18900 }, { description: "Terminal cleaning and charging system test", amountCents: 4500 }], rating: 4, comment: "Fixed the no-start problem. Pickup took a bit longer than quoted but every charge was explained clearly." },
  { c: 2, v: 0, tech: "priya", days: 26, description: "Issues: Oil change or routine maintenance.", diagnosis: "Findings: Oil is dirty / due for change. Notes: Air filter also clogged.", items: [{ description: "Oil and filter service (synthetic 5W-30)", amountCents: 8900 }, { description: "Engine air filter replacement", amountCents: 3500 }], rating: 5, comment: "Quick, clean and fair price. Priya pointed out the dirty air filter and showed me the old one." },
  { c: 3, v: 0, tech: "marcus", days: 22, description: "Issues: A/C or heating not working.", diagnosis: "Findings: A/C refrigerant low or compressor fault.", items: [{ description: "A/C leak check and refrigerant recharge", amountCents: 16500 }], rating: 5, comment: "A/C is ice cold again. Easy approval process on the website." },
  { c: 4, v: 0, tech: "sofia", days: 19, description: "Issues: Check engine light is on.", diagnosis: "Findings: Spark plugs or ignition coil faulty. Notes: Misfire code on cylinder 3.", items: [{ description: "Spark plugs (set of 4) and labor", amountCents: 21000 }, { description: "Ignition coil, cylinder 3", amountCents: 9800 }], rating: 4, comment: null },
  { c: 5, v: 0, tech: "daniel", days: 15, description: "Issues: Strange noises or vibration while driving; Tire wear, flat tire or alignment.", diagnosis: "Findings: Tires worn or misaligned; Suspension components worn (struts, bushings).", items: [{ description: "Four-wheel alignment", amountCents: 11000 }, { description: "Front strut mount replacement", amountCents: 34000 }], rating: 3, comment: "Work was good but the strut estimate was higher than I expected. Appreciated that they explained why before starting." },
  { c: 0, v: 1, tech: "priya", days: 11, description: "Issues: Overheating or coolant leak.", diagnosis: "Findings: Coolant leak / thermostat or radiator fault.", items: [{ description: "Thermostat replacement and coolant flush", amountCents: 27500 }], rating: 5, comment: "No more overheating on the highway. Priya kept me updated at every step." },
  { c: 1, v: 0, tech: "marcus", days: 7, description: "Issues: Transmission or gear shifting problem.", diagnosis: "Findings: Transmission fluid low or shifting fault.", items: [{ description: "Transmission fluid and filter service", amountCents: 31500 }], rating: 5, comment: "Shifts smoothly again. Clear estimate and no surprises on the final price." },
  { c: 2, v: 0, tech: "daniel", days: 4, description: "Issues: Brakes squealing, grinding or soft pedal.", diagnosis: "Findings: Brake rotors warped or scored; Brake pads worn / need replacement.", items: [{ description: "Rear brake pads (set) and labor", amountCents: 22000 }, { description: "Rear rotor resurfacing", amountCents: 9000 }], rating: 4, comment: "Brakes feel solid and the status page kept me updated while I waited." },
  { c: 3, v: 0, tech: "sofia", days: 2, description: "Issues: Oil change or routine maintenance.", diagnosis: "Findings: Oil is dirty / due for change.", items: [{ description: "Oil and filter service (synthetic 5W-30)", amountCents: 8900 }], rating: 5, comment: "In and out fast. Friendly and professional." },
];

async function removeDemoData() {
  const ids = (await prisma.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } }, select: { id: true } })).map((u) => u.id);
  const ofDemo = { serviceRequest: { customerId: { in: ids } } };
  await prisma.review.deleteMany({ where: { customerId: { in: ids } } });
  await prisma.workOrderPart.deleteMany({ where: { workOrder: ofDemo } });
  await prisma.estimateItem.deleteMany({ where: { estimate: { workOrder: ofDemo } } });
  await prisma.estimate.deleteMany({ where: { workOrder: ofDemo } });
  await prisma.workOrder.deleteMany({ where: ofDemo });
  await prisma.serviceRequest.deleteMany({ where: { customerId: { in: ids } } });
  await prisma.vehicle.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await removeDemoData();
  if (process.argv.includes("--clean")) {
    console.log("Demo customers, orders and reviews removed");
    return;
  }

  const techUsers = await prisma.user.findMany({ where: { email: { in: Object.values(TECH) } } });
  const techId = (key: keyof typeof TECH) => {
    const u = techUsers.find((t) => t.email === TECH[key]);
    if (!u) throw new Error(`Technician ${TECH[key]} missing: run prisma/seed-technicians.ts first`);
    return u.id;
  };

  const customers = [];
  const vehicles: Record<string, { id: string }> = {};
  for (const [ci, c] of CUSTOMERS.entries()) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: `${c.name.toLowerCase().replace(/[^a-z]+/g, ".")}${DEMO_DOMAIN}`,
        passwordHash: await bcrypt.hash(randomUUID(), 10), // random: demo customers cannot log in
        role: "CUSTOMER",
      },
    });
    customers.push(user);
    for (const [vi, v] of c.vehicles.entries()) {
      vehicles[`${ci}-${vi}`] = await prisma.vehicle.create({ data: { ...v, vin: demoVin(), ownerId: user.id } });
    }
  }

  for (const j of JOBS) {
    const createdAt = daysAgo(j.days);
    const sr = await prisma.serviceRequest.create({
      data: { description: j.description, status: "CHECKED_IN", vehicleId: vehicles[`${j.c}-${j.v}`].id, customerId: customers[j.c].id, createdAt },
    });
    const wo = await prisma.workOrder.create({
      data: {
        status: "COMPLETED", serviceRequestId: sr.id, technicianId: techId(j.tech), diagnosis: j.diagnosis, createdAt,
        estimate: { create: { status: "APPROVED", createdAt, decidedAt: createdAt, items: { create: j.items } } },
      },
    });
    await prisma.review.create({
      data: {
        workOrderId: wo.id, customerId: customers[j.c].id, technicianId: techId(j.tech),
        rating: j.rating, comment: j.comment, createdAt: new Date(createdAt.getTime() + 86_400_000),
      },
    });
  }

  // Extra cars for the existing test customer (kept if you run --clean)
  const tester = await prisma.user.findUnique({ where: { email: "customer@vsrms.test" } });
  if (tester) {
    for (const [i, v] of [
      { make: "Mazda", model: "CX-5", year: 2020, mileage: 33400 },
      { make: "Jeep", model: "Wrangler", year: 2014, mileage: 88200 },
    ].entries()) {
      const vin = `VSRMSDEMOCUST000${i + 1}`;
      await prisma.vehicle.upsert({ where: { vin }, update: {}, create: { ...v, vin, ownerId: tester.id } });
    }
  }

  console.log(`Seeded ${CUSTOMERS.length} demo customers, ${JOBS.length} completed jobs with reviews, and 2 cars for customer@vsrms.test`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());