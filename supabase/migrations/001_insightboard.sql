-- InsightBoard demo schema
-- Run in the Supabase SQL editor (project: portfolio-backend)

-- Orders table
create table if not exists public.ib_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  product text not null,
  category text not null,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'completed' check (status in ('completed', 'pending', 'refunded')),
  region text not null,
  created_at timestamptz not null default now()
);

-- Analytics events table
create table if not exists public.ib_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'signup', 'purchase')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists ib_orders_created_at_idx on public.ib_orders (created_at desc);
create index if not exists ib_orders_status_idx on public.ib_orders (status);
create index if not exists ib_orders_category_idx on public.ib_orders (category);
create index if not exists ib_events_created_at_idx on public.ib_events (created_at desc);
create index if not exists ib_events_type_idx on public.ib_events (event_type);

-- Row Level Security: public read-only demo data.
-- anon can SELECT both tables; anon can INSERT orders (powers the
-- "Simulate sale" button so visitors see Supabase Realtime working).
alter table public.ib_orders enable row level security;
alter table public.ib_events enable row level security;

drop policy if exists "ib_orders_public_read" on public.ib_orders;
create policy "ib_orders_public_read"
  on public.ib_orders for select
  to anon
  using (true);

drop policy if exists "ib_orders_demo_insert" on public.ib_orders;
create policy "ib_orders_demo_insert"
  on public.ib_orders for insert
  to anon
  with check (true);

drop policy if exists "ib_events_public_read" on public.ib_events;
create policy "ib_events_public_read"
  on public.ib_events for select
  to anon
  using (true);

-- Realtime: allow the anon role to receive INSERT broadcasts on ib_orders.
-- (Run once; harmless if the publication already includes the table.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ib_orders'
  ) then
    alter publication supabase_realtime add table public.ib_orders;
  end if;
end $$;
