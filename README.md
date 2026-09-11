# Vehicle Capital Pro

Production financial control system for unit-based vehicle capital transactions.

## Architecture
- Next.js App Router
- Supabase Auth + PostgreSQL
- Atomic transaction and payment RPCs
- RLS-protected financial tables
- FIFO buying-lot allocation

## Required Vercel environment variables
Set these in the Vercel project for the environments you use:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never commit a Supabase secret/service-role key.

## Financial rules
- 1 Unit = BDT 165,000
- Monthly return = Units × 150 × Rate
- Daily return = Monthly return ÷ 30
- Period return uses inclusive calendar days
- FIFO consumes oldest available buying lots first
- People's Money principal is funding/liability, not profit
- Net profit = selling revenue − FIFO cost − People's return − expenses
