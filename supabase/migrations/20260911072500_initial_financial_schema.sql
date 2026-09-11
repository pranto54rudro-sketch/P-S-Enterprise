create extension if not exists pgcrypto;

create table if not exists public.business_settings (id uuid primary key default gen_random_uuid(), business_name text not null default 'Vehicle Capital Pro', currency text not null default 'BDT', unit_value numeric(14,2) not null default 165000 check (unit_value > 0), multiplier numeric(14,4) not null default 150 check (multiplier > 0), daily_divisor numeric(14,4) not null default 30 check (daily_divisor > 0), opening_capital numeric(18,2) not null default 0 check (opening_capital >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, role text not null default 'owner' check (role in ('owner','admin','viewer')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.parties (id uuid primary key default gen_random_uuid(), name text not null unique, phone text, address text, note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.transactions (id uuid primary key default gen_random_uuid(), type text not null check (type in ('Buying','Selling','People''s Money')), party_id uuid references public.parties(id) on delete set null, transaction_date date not null, due_date date, units numeric(14,4) not null default 0 check (units >= 0), rate numeric(14,4) not null default 0 check (rate >= 0), amount numeric(18,2) not null default 0 check (amount >= 0), paid numeric(18,2) not null default 0 check (paid >= 0), return_paid numeric(18,2) not null default 0 check (return_paid >= 0), owner_funded numeric(18,2) not null default 0 check (owner_funded >= 0), people_funded numeric(18,2) not null default 0 check (people_funded >= 0), note text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.buying_lots (id uuid primary key default gen_random_uuid(), transaction_id uuid not null references public.transactions(id) on delete cascade, lot_date date not null, units numeric(14,4) not null check (units > 0), unit_cost numeric(14,2) not null check (unit_cost >= 0), owner_units numeric(14,4) not null default 0 check (owner_units >= 0), people_units numeric(14,4) not null default 0 check (people_units >= 0), created_at timestamptz not null default now());
create table if not exists public.fifo_allocations (id uuid primary key default gen_random_uuid(), selling_transaction_id uuid not null references public.transactions(id) on delete cascade, buying_lot_id uuid not null references public.buying_lots(id) on delete cascade, units numeric(14,4) not null check (units > 0), unit_cost numeric(14,2) not null check (unit_cost >= 0), cost_amount numeric(18,2) generated always as (units * unit_cost) stored, created_at timestamptz not null default now(), unique(selling_transaction_id, buying_lot_id));
create table if not exists public.payments (id uuid primary key default gen_random_uuid(), transaction_id uuid not null references public.transactions(id) on delete cascade, payment_type text not null check (payment_type in ('principal','return')), direction text not null check (direction in ('received','paid')), amount numeric(18,2) not null check (amount > 0), payment_date date not null default current_date, note text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists public.cash_entries (id uuid primary key default gen_random_uuid(), entry_type text not null check (entry_type in ('Owner Deposit','Owner Withdrawal','Expense')), amount numeric(18,2) not null check (amount > 0), entry_date date not null default current_date, note text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid, action text not null, old_value jsonb, new_value jsonb, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now());

create index if not exists transactions_date_idx on public.transactions(transaction_date);
create index if not exists transactions_type_idx on public.transactions(type);
create index if not exists transactions_party_idx on public.transactions(party_id);
create index if not exists payments_transaction_idx on public.payments(transaction_id);
create index if not exists buying_lots_date_idx on public.buying_lots(lot_date);
create index if not exists fifo_sale_idx on public.fifo_allocations(selling_transaction_id);
create index if not exists fifo_lot_idx on public.fifo_allocations(buying_lot_id);

alter table public.business_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.transactions enable row level security;
alter table public.buying_lots enable row level security;
alter table public.fifo_allocations enable row level security;
alter table public.payments enable row level security;
alter table public.cash_entries enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_owner_or_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','admin')); $$;
revoke execute on function public.is_owner_or_admin() from public;
grant execute on function public.is_owner_or_admin() to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'owner') on conflict (id) do nothing; return new; end; $$;
revoke execute on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create policy "authenticated business settings read" on public.business_settings for select to authenticated using (true);
create policy "owner admin business settings write" on public.business_settings for all to authenticated using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "authenticated parties access" on public.parties for all to authenticated using (true) with check (true);
create policy "authenticated transactions access" on public.transactions for all to authenticated using (true) with check (true);
create policy "authenticated lots access" on public.buying_lots for all to authenticated using (true) with check (true);
create policy "authenticated fifo access" on public.fifo_allocations for all to authenticated using (true) with check (true);
create policy "authenticated payments access" on public.payments for all to authenticated using (true) with check (true);
create policy "authenticated cash access" on public.cash_entries for all to authenticated using (true) with check (true);
create policy "authenticated audit read" on public.audit_logs for select to authenticated using (true);
create policy "authenticated audit insert" on public.audit_logs for insert to authenticated with check (true);

insert into public.business_settings (business_name, currency, unit_value, multiplier, daily_divisor, opening_capital) select 'Vehicle Capital Pro', 'BDT', 165000, 150, 30, 10000000 where not exists (select 1 from public.business_settings);
