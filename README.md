# VSRMS: Vehicle Service & Repair Management System

Team project for CSE 5324-001 Agile Object-Oriented Software Engineering, UT Arlington, Fall 2026.
Team: Anvay Sharma, Dev Thakkar, Kenil Patel.

VSRMS tracks a vehicle repair from the customer's request to the invoice. Customers request service, staff check in vehicles and assign technicians, technicians diagnose and repair, and customers approve estimates, rate the technician and view their history.

**Not deployed (per instructor guidance). It runs locally with the steps below.**

- Repository: https://github.com/anvay2003/vehicle-service-repair-system
- Project board: https://github.com/users/anvay2003/projects/1

## Features by role

| Role | What they can do |
|---|---|
| Customer | Register, add vehicles, request service by ticking common issues, track repair progress, approve or reject the estimate, rate the technician, view service history and invoices, see notifications |
| Service staff / Admin | Check in requests, assign or reassign a technician (picture, name, rating), generate invoices, see notifications. Admin uses the staff screens; there is no admin-specific workflow |
| Technician | Start diagnosis, tick findings, send an itemized estimate, start the repair, record parts used (stock decreases), mark the repair completed, see own ratings and notifications |

## Tech stack

Next.js 16.4.2 (App Router, Turbopack), React, TypeScript, Tailwind CSS 4, Next.js route handlers, PostgreSQL, Prisma 6.19.3 (pinned, see Troubleshooting), NextAuth v4 (credentials + JWT), bcryptjs, zod, Vitest 5.1.0.

## Prerequisites

- Node.js 26.0.0 and npm
- Git
- A PostgreSQL database and its connection URL. Only a Railway-hosted database was tested. Use Railway's **public** URL when running locally (the `.internal` URL works only inside Railway).

## Setup

```bash
git clone https://github.com/anvay2003/vehicle-service-repair-system.git
cd vehicle-service-repair-system
npm install --legacy-peer-deps
cp .env.example .env
```

Edit `.env`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | your PostgreSQL connection URL |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` (required; login fails without it) |
| `NEXTAUTH_URL` | `http://localhost:3000` |

Create the schema and seed data, in this order:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed                       # base users: customer, staff, technician, admin
npx tsx prisma/seed-technicians.ts       # four more technicians with pictures
npx tsx prisma/seed-parts.ts             # parts catalog with stock
npx tsx prisma/seed-demo.ts              # optional: demo customers, cars and reviews
```

If a seed script says `DATABASE_URL` is not found, run it as `npx tsx --env-file=.env prisma/seed-technicians.ts`.
`npx tsx prisma/seed-demo.ts --clean` removes the demo data.

Start the app and keep that terminal open:

```bash
npm run dev
```

Open http://localhost:3000. Run only one dev server at a time.

## Test accounts (development data only, not real credentials)

| Role | Email | Password |
|---|---|---|
| Customer | customer@vsrms.test | password123 |
| Service staff | staff@vsrms.test | password123 |
| Technician | tech@vsrms.test | password123 |
| Admin | admin@vsrms.test | password123 |
| Technician (Marcus Reyes) | marcus@vsrms.test | Marcus-Torque-26 |
| Technician (Priya Nair) | priya@vsrms.test | Priya-Gearbox-26 |
| Technician (Daniel Okafor) | daniel@vsrms.test | Daniel-Piston-26 |
| Technician (Sofia Lindqvist) | sofia@vsrms.test | Sofia-Camshaft-26 |

New customers can register at `/register`.

**Demo data.** `seed-demo.ts` creates six fictional customers (`@demo.vsrms.test`, they cannot log in), ten completed repairs and ten reviews, plus two extra cars for `customer@vsrms.test`. These reviews are **seeded demo data, not real feedback**. Technician pictures are generated cartoon avatars loaded from DiceBear; initials are shown if the service is unreachable.

## Pages

- `/login`: sign in; shows technician ratings and customer reviews
- `/register`: customer registration
- `/dashboard`: overview for the signed-in role, with a notification bell and a tab bar
  - Customer: Overview, Repairs, History, Vehicles, Request service, Notifications
  - Staff/Admin: Overview, Check-in queue, Work orders, Invoices, Notifications
  - Technician: Overview, My work orders, Notifications

Opening a page for another role redirects to `/dashboard`; signed-out visitors go to `/login`.

## API

All routes return JSON. The role guard runs first: `401` without a session and `403` for the wrong role, before any `404` or `409` check.

| Method and path | Roles |
|---|---|
| `POST /api/auth/register` | public (creates a customer) |
| `GET/POST /api/vehicles` |
| `GET/POST /api/service-requests` (`?status=`) | (customers see only their own) |
| `POST /api/service-requests/[id]/check-in` | staff, admin |
| `GET /api/technicians` | 
| `GET /api/work-orders` | all signed-in roles (scoped by role) |
| `POST /api/work-orders/[id]/assign` | staff, admin |
| `PATCH /api/work-orders/[id]/status` | technician (own orders) |
| `POST /api/work-orders/[id]/estimate` | technician (own orders) |
| `POST /api/work-orders/[id]/estimate/decision` | customer (own orders) |
| `GET /api/parts` | technician, staff, admin |
| `POST /api/work-orders/[id]/parts` | technician (own orders, In Repair only) |
| `POST /api/work-orders/[id]/invoice` | staff, admin |
| `POST /api/work-orders/[id]/review` | customer (own, completed orders, once) |
| `GET /api/reviews` | public (first name + last initial, rating, comment) |
| `GET /api/notifications`, `POST /api/notifications/read` | all signed-in roles |

## Work order status rules

`CHECKED_IN` → `DIAGNOSIS` → (technician sends an estimate) `AWAITING_APPROVAL` → (customer decides) `APPROVED` or `REJECTED` → `IN_REPAIR` → `COMPLETED`.

- `DIAGNOSIS` → `AWAITING_APPROVAL` happens only by submitting an estimate.
- Approve and reject belong to the customer. `REJECTED` closes the work order.
- Parts can be recorded only while the order is `IN_REPAIR`. Stock is decremented atomically; `409` if there is not enough.
- An invoice can be generated once per order, after `COMPLETED`, from the approved estimate plus the parts used. No tax is applied.
- Money is stored as integer cents.

## Tests

```bash
npm test          # 22 unit tests (Vitest): state transitions, issue/diagnosis builders, formatters
npm run build     # compiles and type-checks; use this as the gate before every push
```

Saved output: `tests/output/unit-test-output.txt`. The full manual test set (T-01 to T-63) is in `tests/manual-test-cases.md`. There are no automated API or UI tests and no coverage metric.

## Project structure

```
app/            pages and API route handlers (app/api/**/route.ts)
components/     views and panels (CustomerView, StaffView, TechView, EstimateForm, ...)
lib/            prisma, auth, guard (API roles), page-auth, workflow, notify, issues, format, api
prisma/         schema.prisma, migrations/, seed scripts
tests/          unit tests and saved output
types/          NextAuth type extensions
```

## Troubleshooting

- **JWT decryption error or login fails:** `NEXTAUTH_SECRET` is missing or empty in `.env`. Generate it with `openssl rand -base64 32`.
- **Cannot reach the database:** use Railway's public URL, not the `.internal` one.
- **Styling is missing or a CSS/module error appears after switching between `npm run build` and `npm run dev`:** run `rm -rf .next` and restart `npm run dev`. If the package is genuinely missing, run `npm install --legacy-peer-deps`.
- **Odd errors or the app is on port 3001:** another dev server is still running. Stop it (`kill <pid>`) and start one only.
- **`Cannot find name 'LayoutProps'` after `rm -rf .next`:** run `npx next typegen`, then `npx tsc --noEmit`.
- **Prisma CLI errors:** Prisma is pinned to 6.x. The Prisma 8 release candidate broke the CLI. Do not upgrade, and do not run `npm audit fix --force`.
- **`prisma skills sync` message during install:** harmless.
- **`Unique constraint` or missing-technician errors in a seed script:** run the seeds in the order above.

## Known limitations

No email or SMS notifications (in-app only, refreshed every 30 seconds); requests cannot be cancelled or edited; no password reset; no inventory restock screen; invoices have no tax or payment; the "Other needs details" rule is checked in the browser only; one review per repair; no automated API or UI tests; not deployed; development passwords are listed in this README.