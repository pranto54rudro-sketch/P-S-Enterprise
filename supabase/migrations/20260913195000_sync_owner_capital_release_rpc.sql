-- Synchronize the repository migration history with the production Owner Capital release logic.
-- Owner capital is released when owner-funded inventory is sold; therefore available
-- owner capital must be based on the remaining owner-funded inventory cost, not the
-- cumulative historical Buying amount.

create or replace function public.create_financial_transaction(p_type text,p_party_name text,p_party_phone text default '',p_party_address text default '',p_transaction_date date default current_date,p_due_date date default null,p_units numeric default 0,p_rate numeric default 0,p_amount numeric default 0,p_owner_funded numeric default 0,p_people_funded numeric default 0,p_note text default null,p_basis text default 'Monthly',p_start_date date default current_date,p_end_date date default null) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_party uuid; v_id uuid; v_units numeric; v_owner numeric; v_people numeric; v_unit_cost numeric:=165000; v_owner_available numeric; v_remaining numeric; v_lot record; v_take numeric; v_people_cost numeric:=0; v_owner_cost numeric:=0;
begin
 if v_user is null or not exists(select 1 from public.profiles where id=v_user and role in ('owner','admin')) then raise exception 'Not authorized'; end if;
 if p_type not in ('Buying','Selling') then raise exception 'Invalid transaction type'; end if;
 if p_amount<=0 then raise exception 'Amount must be greater than 0'; end if;
 insert into public.parties(name,phone,address) values(trim(p_party_name),nullif(trim(p_party_phone),''),nullif(trim(p_party_address),'')) on conflict(name) do update set phone=coalesce(excluded.phone,parties.phone),address=coalesce(excluded.address,parties.address),updated_at=now() returning id into v_party;
 if p_type='Buying' then
   v_units:=round(p_amount/v_unit_cost,4); if v_units<=0 then raise exception 'Buying amount is too small for one unit'; end if;
   v_people:=least(greatest(coalesce(p_people_funded,0),0),p_amount); v_owner:=p_amount-v_people;
   select greatest(0,coalesce((select opening_capital from public.business_settings limit 1),0)-coalesce((select sum(owner_units*unit_cost) from public.buying_lots where business_code='secondary'),0)) into v_owner_available;
   if v_owner>v_owner_available+0.01 then raise exception 'Insufficient Owner Capital. Available: %, required: %',to_char(v_owner_available,'FM999999999.00'),to_char(v_owner,'FM999999999.00'); end if;
   insert into public.transactions(type,party_id,transaction_date,due_date,start_date,end_date,units,rate,amount,owner_funded,people_funded,realized_profit,basis,note,created_by,business_code) values('Buying',v_party,p_transaction_date,p_due_date,coalesce(p_start_date,p_transaction_date),p_end_date,v_units,p_rate,p_amount,round(v_owner,2),round(v_people,2),0,coalesce(p_basis,'Monthly'),p_note,v_user,'secondary') returning id into v_id;
   insert into public.buying_lots(transaction_id,lot_date,units,unit_cost,owner_units,people_units,business_code) values(v_id,p_transaction_date,v_units,v_unit_cost,v_owner/v_unit_cost,v_people/v_unit_cost,'secondary');
   if v_people>0 then insert into public.people_money_terms(buying_transaction_id,principal,rate,start_date,end_date,status,created_by) values(v_id,v_people,p_rate,coalesce(p_start_date,p_transaction_date),coalesce(p_end_date,p_due_date,p_transaction_date),'active',v_user); end if;
 else
   v_units:=round(coalesce(p_units,0),4); if v_units<=0 then raise exception 'Selling units must be greater than 0'; end if;
   if (select coalesce(sum(units),0) from public.buying_lots where business_code='secondary') < v_units then raise exception 'Insufficient inventory units'; end if;
   insert into public.transactions(type,party_id,transaction_date,due_date,start_date,end_date,units,rate,amount,owner_funded,people_funded,realized_profit,basis,note,created_by,business_code) values('Selling',v_party,p_transaction_date,p_due_date,coalesce(p_start_date,p_transaction_date),p_end_date,v_units,p_rate,p_amount,0,0,0,coalesce(p_basis,'Monthly'),p_note,v_user,'secondary') returning id into v_id;
   v_remaining:=v_units;
   for v_lot in select bl.* from public.buying_lots bl where bl.business_code='secondary' and bl.units>0 order by bl.lot_date,bl.created_at,bl.id for update loop
     exit when v_remaining<=0; v_take:=least(v_remaining,v_lot.units);
     insert into public.fifo_allocations(selling_transaction_id,buying_lot_id,units,unit_cost,cost_amount,owner_units,people_units,business_code) values(v_id,v_lot.id,v_take,v_lot.unit_cost,v_take*v_lot.unit_cost,v_take*(v_lot.owner_units/nullif(v_lot.units,0)),v_take*(v_lot.people_units/nullif(v_lot.units,0)),'secondary');
     update public.buying_lots set units=greatest(0,units-v_take),owner_units=greatest(0,owner_units-v_take*(owner_units/nullif(units,0))),people_units=greatest(0,people_units-v_take*(people_units/nullif(units,0))) where id=v_lot.id;
     v_people_cost:=v_people_cost+v_take*(v_lot.people_units/nullif(v_lot.units,0))*v_lot.unit_cost; v_owner_cost:=v_owner_cost+v_take*(v_lot.owner_units/nullif(v_lot.units,0))*v_lot.unit_cost; v_remaining:=v_remaining-v_take;
   end loop;
   if v_remaining>0.0001 then raise exception 'FIFO inventory allocation failed'; end if;
   update public.transactions set realized_profit=round(p_amount-v_people_cost-v_owner_cost,2),owner_funded=round(v_owner_cost,2),people_funded=round(v_people_cost,2) where id=v_id;
 end if; return v_id;
end $$;

revoke execute on function public.create_financial_transaction(text,text,text,text,date,date,numeric,numeric,numeric,numeric,numeric,text,text,date,date) from public;
grant execute on function public.create_financial_transaction(text,text,text,text,date,date,numeric,numeric,numeric,numeric,numeric,text,text,date,date) to authenticated;
