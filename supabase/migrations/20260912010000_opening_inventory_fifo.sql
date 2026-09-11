-- Opening inventory is inventory that existed before the app's Buying ledger started.
-- It is separate from opening capital and is eligible for FIFO selling.
create table if not exists public.opening_inventory (
  id uuid primary key default gen_random_uuid(),
  opening_date date not null default current_date,
  units numeric not null check (units >= 0),
  total_cost numeric not null check (total_cost >= 0),
  units_remaining numeric not null check (units_remaining >= 0),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opening_inventory_allocations (
  id uuid primary key default gen_random_uuid(),
  selling_transaction_id uuid not null references public.transactions(id) on delete cascade,
  opening_inventory_id uuid not null references public.opening_inventory(id) on delete cascade,
  units numeric not null check (units > 0),
  unit_cost numeric not null check (unit_cost >= 0),
  cost_amount numeric not null check (cost_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists opening_inventory_date_idx on public.opening_inventory(opening_date, created_at, id);
create index if not exists opening_inventory_alloc_selling_idx on public.opening_inventory_allocations(selling_transaction_id);

alter table public.opening_inventory enable row level security;
alter table public.opening_inventory_allocations enable row level security;

drop policy if exists "authenticated read opening inventory" on public.opening_inventory;
create policy "authenticated read opening inventory" on public.opening_inventory for select to authenticated using (true);
drop policy if exists "owner admin opening inventory write" on public.opening_inventory;
create policy "owner admin opening inventory write" on public.opening_inventory for all to authenticated using ((select public.is_owner_or_admin())) with check ((select public.is_owner_or_admin()));

drop policy if exists "authenticated read opening inventory allocations" on public.opening_inventory_allocations;
create policy "authenticated read opening inventory allocations" on public.opening_inventory_allocations for select to authenticated using (true);
drop policy if exists "owner admin opening inventory allocations write" on public.opening_inventory_allocations;
create policy "owner admin opening inventory allocations write" on public.opening_inventory_allocations for all to authenticated using ((select public.is_owner_or_admin())) with check ((select public.is_owner_or_admin()));

-- The application-level RPC is responsible for enforcing the owner/admin check.
create or replace function public.save_opening_inventory(p_units numeric, p_total_cost numeric, p_opening_date date default current_date, p_note text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null or not exists(select 1 from public.profiles where id=v_user and role in ('owner','admin')) then raise exception 'Not authorized'; end if;
  if p_units < 0 or p_total_cost < 0 then raise exception 'Opening inventory cannot be negative'; end if;
  if p_units = 0 and p_total_cost <> 0 then raise exception 'Opening inventory cost requires units'; end if;
  select id into v_id from public.opening_inventory order by opening_date, created_at, id limit 1;
  if v_id is null then
    if p_units = 0 then return null; end if;
    insert into public.opening_inventory(opening_date,units,total_cost,units_remaining,note,created_by)
    values(p_opening_date,p_units,p_total_cost,p_units,p_note,v_user) returning id into v_id;
  else
    update public.opening_inventory set opening_date=p_opening_date,units=p_units,total_cost=p_total_cost,units_remaining=p_units,note=p_note,updated_at=now() where id=v_id;
  end if;
  return v_id;
end $$;

grant execute on function public.save_opening_inventory(numeric,numeric,date,text) to authenticated;
