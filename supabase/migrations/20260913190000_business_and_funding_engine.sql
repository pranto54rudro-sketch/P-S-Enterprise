-- Business separation + funding-aware secondary trading engine.
-- Main Business is intentionally a separate ledger namespace and starts empty.

create table if not exists public.business_ledgers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('main','secondary')),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.business_ledgers(code,name,description)
values
  ('main','Main Business','Primary business ledger; fill in operational data later.'),
  ('secondary','Secondary Business','Unit-based buy/sell capital business.')
on conflict (code) do update set name=excluded.name,description=excluded.description,updated_at=now();

alter table public.transactions add column if not exists business_code text not null default 'secondary' check (business_code in ('main','secondary'));
alter table public.buying_lots add column if not exists business_code text not null default 'secondary' check (business_code in ('main','secondary'));
alter table public.fifo_allocations add column if not exists business_code text not null default 'secondary' check (business_code in ('main','secondary'));
alter table public.payments add column if not exists business_code text not null default 'secondary' check (business_code in ('main','secondary'));
alter table public.cash_entries add column if not exists business_code text not null default 'secondary' check (business_code in ('main','secondary'));

create index if not exists transactions_business_code_idx on public.transactions(business_code);
create index if not exists buying_lots_business_code_idx on public.buying_lots(business_code);
create index if not exists fifo_alloc_business_code_idx on public.fifo_allocations(business_code);
create index if not exists payments_business_code_idx on public.payments(business_code);
create index if not exists cash_entries_business_code_idx on public.cash_entries(business_code);

alter table public.business_ledgers enable row level security;
drop policy if exists "authenticated read business ledgers" on public.business_ledgers;
create policy "authenticated read business ledgers" on public.business_ledgers for select to authenticated using (true);
drop policy if exists "owner admin business ledgers write" on public.business_ledgers;
create policy "owner admin business ledgers write" on public.business_ledgers for all to authenticated using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

-- Funding available from owner capital starts at opening capital and is reduced by the
-- un-recovered owner-funded cost currently sitting in inventory.
create or replace view public.v_secondary_funding_summary as
with owner_inventory as (
  select coalesce(sum(owner_units * unit_cost),0)::numeric(18,2) as owner_inventory_cost
  from public.buying_lots
  where business_code='secondary'
),
people_inventory as (
  select coalesce(sum(people_units * unit_cost),0)::numeric(18,2) as people_inventory_cost
  from public.buying_lots
  where business_code='secondary'
),
people_buy as (
  select coalesce(sum(people_funded),0)::numeric(18,2) as people_funded_total
  from public.transactions
  where business_code='secondary' and type='Buying'
),
people_paid as (
  select coalesce(sum(case when payment_type='principal' and direction='paid' then amount else 0 end),0)::numeric(18,2) as principal_paid
  from public.payments
  where business_code='secondary'
)
select
  coalesce((select opening_capital from public.business_settings limit 1),0)::numeric(18,2) as opening_capital,
  owner_inventory.owner_inventory_cost,
  greatest(0, coalesce((select opening_capital from public.business_settings limit 1),0)-owner_inventory.owner_inventory_cost)::numeric(18,2) as available_owner_capital,
  people_inventory.people_inventory_cost,
  people_buy.people_funded_total,
  people_paid.principal_paid
from owner_inventory,people_inventory,people_buy,people_paid;

-- Rebuild the KPI view around actual FIFO costs and the investor-return payable,
-- rather than treating selling revenue as profit.
create or replace view public.v_business_kpis as
with sales as (
  select t.id,t.amount,
         coalesce(sum(f.cost_amount),0)::numeric(18,2) fifo_cost
  from public.transactions t
  left join public.fifo_allocations f on f.selling_transaction_id=t.id and f.business_code='secondary'
  where t.business_code='secondary' and t.type='Selling'
  group by t.id,t.amount
), people_return as (
  select coalesce(sum(
    greatest(0, (
      ((t.people_funded * t.rate * 150) / 30)
      * greatest(0, (coalesce(t.end_date,current_date) - t.start_date) + 1)
    ))
  ),0)::numeric(18,2) return_due
  from public.transactions t
  where t.business_code='secondary' and t.type='Buying' and t.people_funded>0
), returns_paid as (
  select coalesce(sum(amount),0)::numeric(18,2) amount
  from public.payments
  where business_code='secondary' and payment_type='return' and direction='paid'
), expenses as (
  select coalesce(sum(amount),0)::numeric(18,2) amount
  from public.cash_entries
  where business_code='secondary' and entry_type='Expense'
), opening as (
  select coalesce(opening_capital,0)::numeric(18,2) amount from public.business_settings limit 1
), owner_used as (
  select coalesce(sum(owner_funded),0)::numeric(18,2) amount
  from public.transactions
  where business_code='secondary' and type='Buying'
)
select
  (select amount from opening) opening_capital,
  (select amount from owner_used) owner_capital_used,
  greatest(0,(select amount from opening)-(select amount from owner_used))::numeric(18,2) available_owner_capital,
  coalesce((select sum(amount) from sales),0)::numeric(18,2) selling_revenue,
  coalesce((select sum(amount-fifo_cost) from sales),0)::numeric(18,2) realized_selling_profit,
  (select amount from returns_paid) returns_paid,
  (select amount from expenses) expenses,
  (
    coalesce((select sum(amount-fifo_cost) from sales),0)
    - coalesce((select return_due from people_return),0)
    - (select amount from expenses)
  )::numeric(18,2) net_profit;

-- Transaction RPC: Buying automatically consumes available People's Money first,
-- then falls back to Owner Capital. Selling uses FIFO lot allocation and records the
-- realized margin. Main and secondary ledgers remain separate through business_code.
create or replace function public.create_financial_transaction(
  p_type text,
  p_party_name text,
  p_party_phone text default '',
  p_party_address text default '',
  p_transaction_date date default current_date,
  p_due_date date default null,
  p_units numeric default 0,
  p_rate numeric default 0,
  p_amount numeric default 0,
  p_owner_funded numeric default 0,
  p_people_funded numeric default 0,
  p_note text default null,
  p_basis text default 'Monthly',
  p_start_date date default current_date,
  p_end_date date default null
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_party uuid;
  v_id uuid;
  v_people_available numeric(18,2);
  v_owner_available numeric(18,2);
  v_people numeric(18,2);
  v_owner numeric(18,2);
  v_remaining numeric(18,4);
  v_lot record;
  v_take numeric(18,4);
  v_cost numeric(18,2);
  v_required numeric(18,2);
  v_sold_cost numeric(18,2) := 0;
begin
  if v_user is null or not exists(select 1 from public.profiles where id=v_user and role in ('owner','admin')) then
    raise exception 'Not authorized';
  end if;
  if p_type not in ('Buying','Selling') then raise exception 'Invalid transaction type'; end if;
  if p_amount <= 0 or p_units <= 0 then raise exception 'Amount and units must be greater than 0'; end if;

  insert into public.parties(name,phone,address)
  values(trim(p_party_name),nullif(trim(p_party_phone),''),nullif(trim(p_party_address),''))
  on conflict(name) do update set phone=coalesce(nullif(excluded.phone,''),parties.phone),address=coalesce(nullif(excluded.address,''),parties.address),updated_at=now()
  returning id into v_party;

  if p_type='Buying' then
    select greatest(0,coalesce(sum(people_funded),0)-coalesce(sum(case when payment_type='principal' and direction='paid' then amount else 0 end),0))
      into v_people_available
    from public.transactions t
    left join public.payments pm on pm.transaction_id=t.id
    where t.business_code='secondary' and t.type='Buying';

    select greatest(0,coalesce((select opening_capital from public.business_settings limit 1),0)-coalesce(sum(owner_funded),0))
      into v_owner_available
    from public.transactions where business_code='secondary' and type='Buying';

    -- Explicit values are ignored as funding inputs; allocation is automatic.
    v_people := least(p_amount,coalesce(v_people_available,0));
    v_owner := p_amount-v_people;
    if v_owner > coalesce(v_owner_available,0) then raise exception 'Insufficient combined funding: People''s Money and Owner Capital'; end if;

    insert into public.transactions(type,party_id,transaction_date,due_date,units,rate,amount,owner_funded,people_funded,note,created_by)
    values('Buying',v_party,p_transaction_date,p_due_date,p_units,p_rate,p_amount,v_owner,v_people,p_note,v_user)
    returning id into v_id;

    insert into public.buying_lots(transaction_id,lot_date,units,unit_cost,owner_units,people_units,business_code)
    values(v_id,p_transaction_date,p_units,p_amount/nullif(p_units,0),v_owner/nullif(p_amount/nullif(p_units,0),0),v_people/nullif(p_amount/nullif(p_units,0),0),'secondary');
    return v_id;
  end if;

  select coalesce(sum(units),0) into v_required
  from public.fifo_allocations fa
  join public.transactions st on st.id=fa.selling_transaction_id
  where st.business_code='secondary' and st.type='Selling' and false;

  select coalesce(sum(units),0) into v_remaining from public.buying_lots where business_code='secondary';
  if v_remaining < p_units then raise exception 'Insufficient inventory units'; end if;

  insert into public.transactions(type,party_id,transaction_date,due_date,units,rate,amount,note,created_by)
  values('Selling',v_party,p_transaction_date,p_due_date,p_units,p_rate,p_amount,p_note,v_user)
  returning id into v_id;

  v_remaining := p_units;
  for v_lot in
    select bl.*,
      (bl.units - coalesce((select sum(fa.units) from public.fifo_allocations fa where fa.buying_lot_id=bl.id),0)) remaining_units
    from public.buying_lots bl
    where bl.business_code='secondary'
      and (bl.units - coalesce((select sum(fa.units) from public.fifo_allocations fa where fa.buying_lot_id=bl.id),0)) > 0
    order by bl.lot_date,bl.created_at,bl.id
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining,v_lot.remaining_units);
    insert into public.fifo_allocations(selling_transaction_id,buying_lot_id,units,unit_cost,business_code)
    values(v_id,v_lot.id,v_take,v_lot.unit_cost,'secondary');
    v_sold_cost := v_sold_cost + v_take*v_lot.unit_cost;
    v_remaining := v_remaining-v_take;
  end loop;

  update public.transactions set owner_funded=coalesce((select sum(f.units*f.unit_cost) from public.fifo_allocations f join public.buying_lots l on l.id=f.buying_lot_id where f.selling_transaction_id=v_id and l.owner_units>0),0),
    people_funded=coalesce((select sum(f.units*f.unit_cost) from public.fifo_allocations f join public.buying_lots l on l.id=f.buying_lot_id where f.selling_transaction_id=v_id and l.people_units>0),0)
  where id=v_id;

  return v_id;
end $$;

grant execute on function public.create_financial_transaction(text,text,text,text,date,date,numeric,numeric,numeric,numeric,numeric,text,text,date,date) to authenticated;

-- Normalize existing records as secondary unless explicitly moved later.
update public.transactions set business_code='secondary' where business_code is null;
update public.buying_lots set business_code='secondary' where business_code is null;
update public.fifo_allocations set business_code='secondary' where business_code is null;
update public.payments set business_code='secondary' where business_code is null;
update public.cash_entries set business_code='secondary' where business_code is null;
