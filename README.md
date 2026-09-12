# Vehicle Capital Pro

A full-stack financial control system for unit-based vehicle capital transactions. The app combines a Next.js dashboard, Supabase-backed data storage, and finance logic for buying, selling, People’s Money, payments, inventory lots, and profit reporting.

## Project summary

- Frontend: Next.js 15 + React 19 + TypeScript
- Authentication/data: Supabase Auth + PostgreSQL
- UI structure: App Router pages under `app/`
- Financial engine: custom formulas and FIFO driven inventory allocation
- Security: middleware redirect for authenticated access and RLS-enabled tables

## Core functionality

- Buying and selling transaction tracking
- People’s Money funding and return tracking
- Due-date and overdue alerts
- FIFO inventory and cost allocation
- Business settings and opening capital management
- Party master records and transaction histories
- Cash/expense entries and payment ledger
- KPI and analytics pages
- CSV export and report generation

## Business rules used by the app

The finance logic in the project is built around these rules:

- 1 unit = BDT 165,000
- Monthly return = units × 150 × rate
- Daily return = monthly return ÷ 30
- Period return uses inclusive calendar days
- FIFO consumes the oldest available buying lot first
- People’s Money principal is treated as funding/liability, not profit
- Net profit = selling revenue − FIFO cost − People’s return − expenses
- Buying lots keep their original rate and unit cost for later selling allocation

The formulas are implemented in [lib/financial.ts](lib/financial.ts).

## Tech stack

### Frontend
- Next.js App Router
- React + TypeScript
- CSS in the app pages and global styles
- Dashboard and analytics pages under [app/](app)

### Backend / data layer
- Supabase PostgreSQL
- Row-Level Security on financial tables
- SQL migrations under [supabase/migrations](supabase/migrations)
- Typed database schema in [lib/supabase/database.types.ts](lib/supabase/database.types.ts)

### Auth / routing
- Supabase SSR client in [lib/supabase/client.ts](lib/supabase/client.ts) and [lib/supabase/server.ts](lib/supabase/server.ts)
- Auth gate in [middleware.ts](middleware.ts)
- Proxy logic in [proxy.ts](proxy.ts)

## App pages

- [app/page.tsx](app/page.tsx) — main financial dashboard
- [app/analytics/page.tsx](app/analytics/page.tsx) — analytics and business ratio views
- [app/login/page.tsx](app/login/page.tsx) — login screen
- [app/login/README.md](app/login/README.md) — login security notes
- [app/secondary/page.tsx](app/secondary/page.tsx) — secondary business dashboard/reporting view

## Project structure

- [package.json](package.json) — scripts and dependencies
- [middleware.ts](middleware.ts) — route protection
- [proxy.ts](proxy.ts) — Supabase Auth cookie proxy
- [lib/financial.ts](lib/financial.ts) — calculation engine
- [lib/supabase](lib/supabase) — Supabase client integration and typed schema
- [supabase/migrations](supabase/migrations) — database schema and opening-inventory setup
- [components](components) — reusable UI pieces such as logout/report tools

## Setup and local development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a local `.env.local` file and add the required Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The app also contains fallback hardcoded values in the Supabase clients, but production deployment should use real environment variables.

### 3. Run the app

```bash
npm run dev
```

Then open the local Next.js URL shown in the terminal.

### 4. Production build

```bash
npm run build
npm run start
```

### 5. Lint

```bash
npm run lint
```

## Supabase setup notes

The schema is created and updated through SQL migration files in [supabase/migrations](supabase/migrations). Important tables include:

- `business_settings`
- `profiles`
- `parties`
- `transactions`
- `buying_lots`
- `fifo_allocations`
- `payments`
- `cash_entries`
- `audit_logs`
- `opening_inventory`

The initial schema in [supabase/migrations/20260911072500_initial_financial_schema.sql](supabase/migrations/20260911072500_initial_financial_schema.sql) sets up the main financial model, access policies, user profile creation hooks, and default business settings.

The subsequent migration in [supabase/migrations/20260912010000_opening_inventory_fifo.sql](supabase/migrations/20260912010000_opening_inventory_fifo.sql) adds opening inventory support and FIFO tracking for existing stock before the app ledger began.

## Security and auth behavior

- Unauthenticated users are redirected to `/login`.
- Authenticated users are redirected away from `/login` to the home dashboard.
- The route guard is enforced in [middleware.ts](middleware.ts) and uses the Supabase SSR client.
- There are admin/owner checks in the migration SQL and policies.

The login route documentation is in [app/login/README.md](app/login/README.md).

## Important implementation notes

- The project treats the unit value as BDT 165,000 throughout the app calculations.
- People’s Money is tracked via funding attached to buying transactions, not as owner capital.
- Selling cost is calculated from FIFO lot allocations, not a simple average cost.
- Financial writes are recorded with audit-like patterns alongside the transactional tables.
- The dashboard and analytics pages rely on live Supabase data and subscribe to database changes.

## Known deployment guidance

For Vercel or similar deployments, set these environment variables for the target environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit any service-role or secret key. Only the publishable key is used by the frontend client.

## Summary

This repository is a production-style accounting and operating dashboard for a vehicle capital business. It centralizes financing rules, party records, transaction tracking, FIFO cost allocation, People’s Money returns, and reporting into a single application.

For deeper operational notes, see the login document and the SQL migration files in [supabase/migrations](supabase/migrations).
