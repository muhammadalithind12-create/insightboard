# InsightBoard — Real-Time Business Analytics Dashboard

**Live demo:** /live-dashboard (public — no login required)

InsightBoard is a real-time business analytics dashboard. Revenue, orders, average order value, and conversion rate stream in live — open the dashboard, hit **"Simulate sale"**, and watch the new order appear instantly via Supabase Realtime.

## Features

- **KPI cards** — Total Revenue, Orders, Avg. Order Value, Conversion Rate, each with period-over-period change vs. the previous period
- **Revenue-over-time chart** — area chart with 7/30/90-day range selector
- **Revenue by category** — donut breakdown (Subscriptions, Add-ons, Services, Usage)
- **Top products table** — ranked by revenue
- **Sales by region** — bar breakdown across 5 regions
- **Live activity feed** — Supabase Realtime `INSERT` subscription on orders with a pulsing LIVE indicator; new sales flash green as they land
- **Simulate sale button** — inserts a random demo order through Row Level Security so visitors see realtime working end-to-end
- **Dark mode** — full light/dark theme support

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Supabase: PostgreSQL, Row Level Security, Realtime
- Recharts for visualizations, shadcn/ui + Tailwind CSS
- pnpm monorepo (app in `apps/web`)

## Realtime architecture

```
visitor clicks "Simulate sale"
  → anon INSERT into public.ib_orders (RLS policy: demo insert allowed)
  → Postgres WAL → Supabase Realtime broadcast
  → dashboard channel (postgres_changes, INSERT, ib_orders)
  → row prepended to feed + KPIs/charts recompute
```

RLS: `anon` gets `SELECT` on `ib_orders` / `ib_events` and `INSERT` on `ib_orders` only — read-only demo data with a single controlled write path. The `ib_orders` table is added to the `supabase_realtime` publication (see migration).

## Setup

1. Create a Supabase project and note the project URL + publishable (anon) key.
2. Run `supabase/migrations/001_insightboard.sql` in the SQL editor (tables, indexes, RLS, realtime publication).
3. Run `supabase/seeds/demo.sql` in the SQL editor (~120 orders over 90 days, ~300 events over 30 days).
4. In `apps/web`, set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. `pnpm install` then `pnpm --filter @insightboard/web dev` (verify the package name in `apps/web/package.json`) and open /live-dashboard.

## Project structure

```
supabase/
  migrations/001_insightboard.sql   # ib_orders, ib_events, RLS, realtime
  seeds/demo.sql                    # deterministic demo dataset
apps/web/src/
  app/(external-pages)/live-dashboard/  # public showcase dashboard
  components/insightboard/          # dashboard client component
  lib/insightboard.ts               # types, formatting, demo order generator
```

## Attribution

Built on the [nextbase-nextjs-supabase-starter](https://github.com/awakenedpigeon/nextbase-nextjs-supabase-starter) (MIT License — see `LICENSE`). The analytics dashboard, realtime feed, database schema, seed data, and all InsightBoard branding are original work for this project.

## License

MIT — see `LICENSE`.
