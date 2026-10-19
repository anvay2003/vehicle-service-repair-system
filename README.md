# vehicle-service-repair-system
# VSRMS: Vehicle Service & Repair Management System

Web application for an independent auto repair shop. A customer registers a vehicle and requests service, staff check the vehicle in and assign a technician, and the technician records a diagnosis and advances the repair status. The customer sees progress on their dashboard.

Course project for CSE 5324-001 Agile Object-Oriented Software Engineering (UT Arlington, Fall 2026).
Team: Anvay Sharma, Dev Thakkar, Kenil Patel.

## Current status

This is a partial system built for Submission 2 (Project Progress Report).

| Area | Status |
|---|---|
| US-01 Register vehicle | Done |
| US-02 Submit service request | Done |
| US-03 Check in vehicle / create work order | Done |
| US-04 Assign technician | Done |
| US-05 Diagnosis and status tracking | Done up to `AWAITING_APPROVAL` |
| US-06 Estimate approval/rejection | Not started |
| US-07 Parts, US-08 Invoice, US-09 History, US-10 Notifications | Not started |

Known gaps:
- There is no registration page. Customer accounts can only be created through `POST /api/auth/register`.
- The customer approve/reject step is not built, so work orders cannot move past `AWAITING_APPROVAL` in the UI.
- There are no automated tests. Testing so far was manual (see the progress report, Section 9).
- The application is not deployed. It runs locally.

## Tech stack

- Next.js 16 (App Router, Turbopack), React, TypeScript, Tailwind CSS
- Next.js API route handlers
- PostgreSQL (hosted on Railway) with Prisma 6
- NextAuth v4 (credentials provider, JWT sessions), bcryptjs, zod

Prisma is pinned to version 6. A Prisma 8 release candidate broke the CLI, so do not upgrade it.

## Getting started

### Prerequisites
- Node.js (current LTS) and npm
- A PostgreSQL database. This project used a Railway database.

### 1. Clone and install

```bash
git clone https://github.com/anvay2003/vehicle-service-repair-system.git
cd vehicle-service-repair-system
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is needed because of NextAuth's peer dependency range. During install you may see a Prisma message about an unknown `skills` command and a deprecation warning for `package.json#prisma`. Both are harmless.

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

- `DATABASE_URL`: your PostgreSQL connection string. If you use Railway, use the **public** database URL when running locally. The `.internal` URL only works inside Railway.
- `NEXTAUTH_SECRET`: a generated secret. Create one with:
  ```bash
  openssl rand -base64 32
  ```
  Without it, login fails with a JWT decryption error.

`.env` is git-ignored. Never commit real credentials. `.env.example` contains placeholder values only.

### 3. Set up the database

For a new, empty database:

```bash
npx prisma migrate deploy
npx prisma db seed
```

If you are connecting to a database that has already been migrated and seeded, skip this step.

### 4. Run the app

```bash
npm run dev
```

Open the URL printed in the terminal (normally http://localhost:3000). Keep that terminal open while you use the app. Run other commands in a second terminal.

Other commands:

```bash
npm run build        # production build (also runs the TypeScript check)
npx tsc --noEmit     # type check only
```

## Test accounts

The seed script creates one account per role. These are development accounts for a test database only.

| Role | Email | Password |
|---|---|---|
| Customer | customer@vsrms.test | password123 |
| Staff | staff@vsrms.test | password123 |
| Technician | tech@vsrms.test | password123 |
| Admin | admin@vsrms.test | password123 |

Suggested walkthrough:
1. Log in as the customer, register a vehicle, and submit a service request.
2. Log in as staff, check in the request, and assign the technician.
3. Log in as the technician, move the work order to Diagnosis, then enter a diagnosis and move it to Awaiting Approval.
4. Log in as the customer and see the updated status and diagnosis.

## Roles

`CUSTOMER`, `STAFF`, `TECHNICIAN`, `ADMIN`. Each protected API route checks the caller's role with `requireRole` in `lib/guard.ts`. A request with no session gets `401`; a signed-in user with the wrong role gets `403`. Admin currently shares the staff functions and has no dedicated workflow yet.

## API endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer account |
| GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth sign-in and session |
| GET, POST | `/api/vehicles` | Customer | List own vehicles; register a vehicle |
| GET | `/api/service-requests` | Customer, Staff, Admin | List requests (customers see only their own). Optional `?status=REQUESTED`, `CHECKED_IN` or `CANCELLED` |
| POST | `/api/service-requests` | Customer | Submit a request for an owned vehicle (404 if the vehicle is not theirs) |
| POST | `/api/service-requests/[id]/check-in` | Staff, Admin | Check in a request and create its work order in one transaction (404 not found, 409 if not `REQUESTED`) |
| GET | `/api/technicians` | Staff, Admin | List technicians |
| GET | `/api/work-orders` | Signed-in roles | List work orders, scoped by role |
| POST | `/api/work-orders/[id]/assign` | Staff, Admin | Assign a technician |
| PATCH | `/api/work-orders/[id]/status` | Technician | Advance the status of an own work order; body `{ "status": "..." }` |

### Work-order status rules

Technicians may make these transitions only (`lib/workflow.ts`):

- `CHECKED_IN` to `DIAGNOSIS`
- `DIAGNOSIS` to `AWAITING_APPROVAL` (requires diagnosis text)
- `APPROVED` to `IN_REPAIR`
- `IN_REPAIR` to `COMPLETED`

Any other jump returns `409`. The customer's approve/reject step (`AWAITING_APPROVAL` to `APPROVED` or `REJECTED`) is not built yet.

## Data model

Prisma models (see `prisma/schema.prisma`):

- **User**: name, unique email, password hash, role
- **Vehicle**: make, model, year, unique VIN, mileage, owner
- **ServiceRequest**: description, status (`REQUESTED`, `CHECKED_IN`, `CANCELLED`), vehicle, customer; has zero or one WorkOrder
- **WorkOrder**: status, optional technician, optional diagnosis; linked to exactly one ServiceRequest

Estimate, Part, Invoice and Notification models are planned and not created yet.

## Project structure

```
app/            pages and API routes (app/api/...), login and dashboard
components/     CustomerView, StaffView, TechView, SignOutButton
lib/            prisma client, auth, guard (requireRole), workflow rules, helpers
prisma/         schema, migrations, seed
types/          NextAuth type extensions
```

## Troubleshooting

- **Login fails with a JWT decryption error:** `NEXTAUTH_SECRET` is missing or changed. Set it in `.env`, restart, and clear the site's cookies for localhost.
- **Cannot reach the database:** use the public database URL, not the `.internal` one, and check that the Railway service is running.
- **Page shows a build or CSS error after switching between `build` and `dev`:** stop the server, run `rm -rf .next`, and start `npm run dev` again.
- **Port 3000 already in use:** stop the other process (`lsof -i :3000`, then `kill <PID>`) or use the port the terminal reports.
- **`npm install` complains about peer dependencies:** use `--legacy-peer-deps`.

## Project links

- Repository: https://github.com/anvay2003/vehicle-service-repair-system
- Project board: https://github.com/users/anvay2003/projects/1
