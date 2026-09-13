'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MasterAiFab from '@/components/MasterAiFab';

const UNIT = 165000;
const BASE = 150;
const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(Number(n) || 0);
const units = (n: number) => (Number(n) || 0).toFixed(4);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
const monthStart = () => `${today().slice(0, 8)}01`;

type Tx = {
  id: string; type: 'Buying' | 'Selling'; party: string; transaction_date: string; units: number; amount: number;
  rate: number; paid: number; owner_funded: number; people_funded: number; realized_profit: number;
  due_date: string | null; start_date: string; end_date: string | null; basis: string; note: string | null;
};
type Lot = { transaction_id: string; units: number; unit_cost: number; owner_units: number; people_units: number };
type Alloc = { selling_transaction_id: string; units: number; cost_amount: number; owner_units: number; people_units: number };
type Action = 'edit' | 'renew';

export default function SecondaryBusinessV2() {
  const db = createClient();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [allocs, setAllocs] = useState<Alloc[]>([]);
  const [active, setActive] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'new' | Action | null>(null);
  const [selected, setSelected] = useState<Tx | null>(null);
  const [mode, setMode] = useState<'Buying' | 'Selling'>('Buying');
  const [saving, setSaving] = useState(false);
  const [projection, setProjection] = useState(1);

  const load = async () => {
    setLoading(true);
    const [t, l, a] = await Promise.all([
      db.from('transactions').select('*,parties(name)').eq('business_code', 'secondary').order('transaction_date', { ascending: false }),
      db.from('buying_lots').select('transaction_id,units,unit_cost,owner_units,people_units').eq('business_code', 'secondary').order('lot_date'),
      db.from('fifo_allocations').select('selling_transaction_id,units,cost_amount,owner_units,people_units').eq('business_code', 'secondary')
    ]);
    const firstError = [t, l, a].find((x: any) => x.error)?.error;
    if (firstError) setError(firstError.message);
    setTxs((t.data || []).map((x: any) => ({ ...x, party: x.parties?.name || '—', units: +x.units, amount: +x.amount, rate: +x.rate, paid: +x.paid, owner_funded: +x.owner_funded, people_funded: +x.people_funded, realized_profit: +x.realized_profit })));
    setLots((l.data || []).map((x: any) => ({ ...x, units: +x.units, unit_cost: +x.unit_cost, owner_units: +x.owner_units, people_units: +x.people_units })));
    setAllocs((a.data || []).map((x: any) => ({ ...x, units: +x.units, cost_amount: +x.cost_amount, owner_units: +x.owner_units, people_units: +x.people_units })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const buying = useMemo(() => txs.filter(x => x.type === 'Buying'), [txs]);
  const selling = useMemo(() => txs.filter(x => x.type === 'Selling'), [txs]);
  const byId = useMemo(() => Object.fromEntries(txs.map(x => [x.id, x])), [txs]);
  const bought = buying.reduce((a, x) => a + x.units, 0);
  const sold = selling.reduce((a, x) => a + x.units, 0);
  const available = Math.max(0, bought - sold);
  const operationalPeopleReceived = buying.reduce((a, x) => a + (x.people_funded > 0 ? x.people_funded : 0), 0);
  const peopleUsed = selling.reduce((a, x) => a + x.people_funded, 0);
  const peopleRemaining = Math.max(0, operationalPeopleReceived - peopleUsed);
  const peopleUnits = lots.reduce((a, x) => a + x.people_units, 0);
  const ownerUnits = lots.reduce((a, x) => a + x.owner_units, 0);
  const ownerInventory = ownerUnits * UNIT;
  const monthly = txs.filter(x => x.transaction_date >= monthStart() && x.transaction_date <= today());

  const due = useMemo(() => {
    const d = today();
    let payable = 0, peopleIncome = 0, ownerIncome = 0;
    for (const x of buying) if (x.due_date && x.due_date <= d) payable += x.units * BASE * x.rate;
    for (const a of allocs) {
      const s = byId[a.selling_transaction_id];
      if (s?.due_date && s.due_date <= d) {
        peopleIncome += a.people_units * BASE * s.rate;
        ownerIncome += a.owner_units * BASE * s.rate;
      }
    }
    return { payable, peopleIncome, peopleMargin: peopleIncome - payable, ownerIncome, net: peopleIncome - payable + ownerIncome };
  }, [buying, allocs, byId]);

  const save = async (form: HTMLFormElement, kind: 'new' | Action) => {
    setSaving(true); setError('');
    const f = new FormData(form);
    const type = (String(f.get('type') || selected?.type || mode)) as 'Buying' | 'Selling';
    const party = String(f.get('party') || '').trim();
    const amount = Number(f.get('amount')) || 0;
    const sellUnits = Number(f.get('units')) || 0;

    if (kind === 'renew' && selected?.type === 'Selling') {
      setError('Selling entries cannot create a new trade through Renew. Use Edit to change the Selling period; Renew is reserved for investor Buying periods.');
      setSaving(false);
      return;
    }

    if (kind === 'new') {
      if (!party || amount <= 0 || (type === 'Selling' && sellUnits <= 0)) {
        setError('Party, amount and selling units are required.'); setSaving(false); return;
      }
      const { error: e } = await db.rpc('create_financial_transaction', {
        p_type: type,
        p_party_name: party,
        p_party_phone: '',
        p_party_address: '',
        p_transaction_date: String(f.get('date') || today()),
        p_due_date: String(f.get('due') || '') || null,
        p_units: type === 'Buying' ? amount / UNIT : sellUnits,
        p_rate: Number(f.get('rate')) || 0,
        p_amount: amount,
        p_owner_funded: 0,
        p_people_funded: type === 'Buying' ? amount : 0,
        p_note: String(f.get('note') || ''),
        p_basis: String(f.get('basis') || 'Monthly'),
        p_start_date: String(f.get('start') || today()),
        p_end_date: String(f.get('end') || '') || null
      });
      if (e) setError(e.message);
      else {
        setNotice(type === 'Buying' ? 'Buying saved. Buying Amount is People’s Money principal and Units were calculated automatically.' : 'Selling saved. FIFO used People’s Money first, then Owner Capital.');
        setModal(null); await load();
      }
    } else if (selected) {
      const result = kind === 'edit'
        ? await db.rpc('update_financial_transaction', {
            p_transaction_id: selected.id,
            p_transaction_date: String(f.get('date') || selected.transaction_date),
            p_due_date: String(f.get('due') || '') || null,
            p_rate: Number(f.get('rate')) || 0,
            p_note: String(f.get('note') || ''),
            p_basis: String(f.get('basis') || selected.basis || 'Monthly'),
            p_start_date: String(f.get('start') || selected.start_date || selected.transaction_date),
            p_end_date: String(f.get('end') || '') || null
          })
        : await db.rpc('renew_financial_transaction', {
            p_transaction_id: selected.id,
            p_due_date: String(f.get('due') || '') || null,
            p_end_date: String(f.get('end') || '') || null,
            p_rate: Number(f.get('rate')) || selected.rate,
            p_note: String(f.get('note') || selected.note || '')
          });
      if (result.error) setError(result.error.message);
      else { setNotice(kind === 'edit' ? 'Entry updated.' : 'Investor entry renewed. Original history remains intact.'); setModal(null); await load(); }
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this entry? Paid entries cannot be deleted. Selling deletion restores its FIFO inventory allocation.')) return;
    const { error: e } = await db.rpc('delete_financial_transaction', { p_transaction_id: id });
    if (e) setError(e.message); else { setNotice('Entry deleted and audit history recorded.'); await load(); }
  };

  const open = (kind: Action, x: Tx) => { setSelected(x); setMode(x.type); setModal(kind); };

  if (loading) return <main className="sb-loading"><div className="loader-dot" />Loading Secondary Business…</main>;

  return <main className="sb"><style>{css}</style>
    <aside>
      <div className="brand"><b>AP</b><span>A P TRADERS<small>SECONDARY BUSINESS</small></span></div>
      {['Dashboard', 'Buying', 'Selling', 'People’s Money', 'Capital', 'Units', 'Due Profit', 'Analytics', 'Reports'].map(n => <button className={active === n ? 'active' : ''} key={n} onClick={() => setActive(n)}>{n}</button>)}
      <div className="rules"><b>BUSINESS ENGINE</b><span>Buying = People’s Money</span><span>1 Unit = ৳165,000</span><span>People → Owner FIFO</span><span>Profit recognized at Due Date</span></div>
    </aside>
    <section className="body">
      <header><div><small>SECONDARY BUSINESS · LIVE LEDGER</small><h1>{active}</h1></div><div className="head-actions"><button onClick={load}>↻ Refresh</button>{(active === 'Buying' || active === 'Selling') && <button className="primary" onClick={() => { setMode(active as 'Buying' | 'Selling'); setSelected(null); setModal('new'); }}>＋ New {active}</button>}</div></header>
      {notice && <div className="notice">✓ {notice}</div>}{error && <div className="error">{error}</div>}
      {active === 'Dashboard' && <Dashboard txs={txs} buying={buying} selling={selling} peopleRemaining={peopleRemaining} available={available} peopleUnits={peopleUnits} ownerUnits={ownerUnits} ownerInventory={ownerInventory} monthly={monthly} due={due} />}
      {active === 'Buying' && <Ledger rows={buying} kind="Buying" onAction={open} onDelete={del} />}
      {active === 'Selling' && <Ledger rows={selling} kind="Selling" onAction={open} onDelete={del} />}
      {active === 'People’s Money' && <People buying={buying} remaining={peopleRemaining} units={peopleUnits} payable={buying.reduce((a, x) => a + x.units * BASE * x.rate, 0)} onAction={open} onDelete={del} />}
      {active === 'Capital' && <Capital ownerUnits={ownerUnits} ownerInventory={ownerInventory} />}
      {active === 'Units' && <div className="cards"><Card t="Bought" v={units(bought)} s="Units" /><Card t="Sold" v={units(sold)} s="Units" /><Card t="Available" v={units(available)} s="Current inventory" /><Card t="People / Owner" v={`${units(peopleUnits)} / ${units(ownerUnits)}`} s="Remaining inventory" /></div>}
      {active === 'Due Profit' && <Due due={due} projection={projection} setProjection={setProjection} />}
      {active === 'Analytics' && <Analytics buying={buying} selling={selling} peopleReceived={operationalPeopleReceived} ownerInventory={ownerInventory} available={available} bought={bought} sold={sold} />}
      {active === 'Reports' && <Ledger rows={txs} kind="All" onAction={open} onDelete={del} />}
      {modal && <EntryModal kind={modal} mode={mode} selected={selected} onClose={() => setModal(null)} onSave={save} saving={saving} />}
      <MasterAiFab />
    </section>
  </main>;
}

function Dashboard({ txs, buying, selling, peopleRemaining, available, peopleUnits, ownerUnits, ownerInventory, monthly, due }: { txs: Tx[]; buying: Tx[]; selling: Tx[]; peopleRemaining: number; available: number; peopleUnits: number; ownerUnits: number; ownerInventory: number; monthly: Tx[]; due: any }) {
  const mb = monthly.filter(x => x.type === 'Buying'); const ms = monthly.filter(x => x.type === 'Selling');
  const monthBuying = mb.reduce((a, x) => a + x.amount, 0); const monthSelling = ms.reduce((a, x) => a + x.amount, 0); const max = Math.max(1, monthBuying, monthSelling);
  return <>
    <section className="hero"><div><span className="eyebrow">DAILY OPERATING POSITION</span><h2>Principal first. Profit when due.</h2><p>Operational capital and inventory stay separate from payable investor profit.</p></div><div className="pulse"><i /> LIVE LEDGER</div></section>
    <div className="section-title">MONTHLY UPDATE · {monthStart().slice(0, 7)}</div>
    <div className="cards">
      <Card t="Buying Amount" v={'৳' + money(monthBuying)} s={`${mb.length} entries`} /><Card t="Selling Amount" v={'৳' + money(monthSelling)} s={`${ms.length} entries`} />
      <Card t="Units Bought" v={units(mb.reduce((a, x) => a + x.units, 0))} s="This month" /><Card t="Units Sold" v={units(ms.reduce((a, x) => a + x.units, 0))} s="This month" />
      <Card t="People’s Money" v={'৳' + money(mb.reduce((a, x) => a + (x.people_funded || 0), 0))} s="Buying principal recorded" /><Card t="Payable Profit Due" v={'৳' + money(due.payable)} s="Investor obligation" />
      <Card t="People Margin Due" v={'৳' + money(due.peopleMargin)} s="Due-date recognized" /><Card t="Net Profit Due" v={'৳' + money(due.net)} s="After due date" />
    </div>
    <section className="chart-grid"><div className="panel chart-card"><div className="panel-head"><h3>Buying vs Selling</h3><span>৳ value</span></div><div className="bars"><div className="bar-wrap"><div className="bar buying-bar" style={{ height: `${Math.max(8, monthBuying / max * 100)}%` }} /><b>Buying</b><small>৳{money(monthBuying)}</small></div><div className="bar-wrap"><div className="bar selling-bar" style={{ height: `${Math.max(8, monthSelling / max * 100)}%` }} /><b>Selling</b><small>৳{money(monthSelling)}</small></div></div></div><div className="panel"><div className="panel-head"><h3>Funding Position</h3><span>Current</span></div><div className="funding-line"><span>People’s Money</span><b>৳{money(peopleRemaining)}</b></div><div className="funding-line"><span>Owner Capital in Inventory</span><b>৳{money(ownerInventory)}</b></div><div className="funding-line"><span>Available Units</span><b>{units(available)}</b></div></div></section>
    <div className="section-title">TOTAL UPDATE · ALL TIME</div>
    <div className="cards"><Card t="Total Buying" v={'৳' + money(buying.reduce((a, x) => a + x.amount, 0))} s={`${buying.length} entries`} /><Card t="Total Selling" v={'৳' + money(selling.reduce((a, x) => a + x.amount, 0))} s={`${selling.length} entries`} /><Card t="People’s Money Received" v={'৳' + money(buying.reduce((a, x) => a + (x.people_funded || 0), 0))} s="Actual People funding" /><Card t="People’s Money Remaining" v={'৳' + money(peopleRemaining)} s="Outstanding principal" /><Card t="Available Units" v={units(available)} s="Current inventory" /><Card t="People Units" v={units(peopleUnits)} s="Remaining" /><Card t="Owner Units" v={units(ownerUnits)} s="Remaining" /><Card t="Owner Capital in Inventory" v={'৳' + money(ownerInventory)} s="Current owner position" /></div>
    <section className="total-strip"><div><span>Total Entries</span><b>{txs.length}</b></div><div><span>Due Profit</span><b>৳{money(due.net)}</b></div><div><span>Funding Order</span><b>People → Owner</b></div></section>
  </>;
}

function People({ buying, remaining, units: peopleUnitCount, payable, onAction, onDelete }: { buying: Tx[]; remaining: number; units: number; payable: number; onAction: (k: Action, x: Tx) => void; onDelete: (id: string) => void }) {
  return <><div className="cards"><Card t="People’s Money Received" v={'৳' + money(buying.reduce((a, x) => a + (x.people_funded || 0), 0))} s="Buying Amount for new entries" /><Card t="People’s Money Remaining" v={'৳' + money(remaining)} s="Outstanding principal" /><Card t="People’s Units" v={units(peopleUnitCount)} s="Inventory funded by People" /><Card t="Payable Profit" v={'৳' + money(payable)} s="Units × 150 × Buying Rate" /></div><Ledger rows={buying} kind="Buying" onAction={onAction} onDelete={onDelete} /></>;
}

function Capital({ ownerUnits, ownerInventory }: { ownerUnits: number; ownerInventory: number }) { return <div className="cards"><Card t="Owner Units" v={units(ownerUnits)} s="Remaining" /><Card t="Owner Capital in Inventory" v={'৳' + money(ownerInventory)} s="Units × ৳165,000" /><Card t="Funding Priority" v="People → Owner" s="FIFO selling order" /></div>; }

function Due({ due, projection, setProjection }: { due: any; projection: number; setProjection: (n: number) => void }) {
  return <><div className="cards"><Card t="People Payable Due" v={'৳' + money(due.payable)} s="Investor payable" /><Card t="People Margin Profit" v={'৳' + money(due.peopleMargin)} s="People income − payable" /><Card t="Owner Earning Due" v={'৳' + money(due.ownerIncome)} s="Owner-funded earning" /><Card t="Net Profit Due" v={'৳' + money(due.net)} s="Due-date recognized" /></div><section className="projection"><div className="panel-head"><b>Profit Projection</b><span>Projection only — not realized profit</span></div><div className="seg">{[1, 3, 6].map(n => <button className={projection === n ? 'sel' : ''} onClick={() => setProjection(n)} key={n}>{n} Month</button>)}</div><div className="cards"><Card t={`${projection} Month People Margin`} v={'৳' + money(due.peopleMargin * projection)} s="Projection only" /><Card t={`${projection} Month Owner Earning`} v={'৳' + money(due.ownerIncome * projection)} s="Projection only" /><Card t={`${projection} Month Net Profit`} v={'৳' + money(due.net * projection)} s="Projection only" /></div></section></>;
}

function Analytics({ buying, selling, peopleReceived, ownerInventory, available, bought, sold }: { buying: Tx[]; selling: Tx[]; peopleReceived: number; ownerInventory: number; available: number; bought: number; sold: number }) {
  const total = peopleReceived + ownerInventory; const buyAmount = buying.reduce((a, x) => a + x.amount, 0); const sellAmount = selling.reduce((a, x) => a + x.amount, 0); const max = Math.max(1, buyAmount, sellAmount);
  return <><div className="cards"><Card t="People Funding %" v={(total ? peopleReceived / total * 100 : 0).toFixed(1) + '%'} s="Funding mix" /><Card t="Owner Funding %" v={(total ? ownerInventory / total * 100 : 0).toFixed(1) + '%'} s="Current position" /><Card t="Unit Utilization" v={(bought ? sold / bought * 100 : 0).toFixed(1) + '%'} s="Sold ÷ bought" /><Card t="Available Units" v={units(available)} s="Current inventory" /></div><div className="panel"><div className="panel-head"><h3>Lifetime Activity</h3><span>Transaction value</span></div><div className="bars tall"><div className="bar-wrap"><div className="bar buying-bar" style={{ height: `${Math.max(8, buyAmount / max * 100)}%` }} /><b>Buying</b><small>৳{money(buyAmount)}</small></div><div className="bar-wrap"><div className="bar selling-bar" style={{ height: `${Math.max(8, sellAmount / max * 100)}%` }} /><b>Selling</b><small>৳{money(sellAmount)}</small></div></div></div></>;
}

function Ledger({ rows, kind, onAction, onDelete }: { rows: Tx[]; kind: string; onAction: (k: Action, x: Tx) => void; onDelete: (id: string) => void }) {
  return <section className="panel ledger"><div className="panel-head"><div><h3>{kind === 'Buying' ? 'Buying — People’s Money' : kind === 'Selling' ? 'Selling — People first, Owner second' : 'All Transactions'}</h3><span className="subhead">Every entry keeps its full lifecycle: Edit · Renew · Delete</span></div><span>{rows.length} entries</span></div><div className="tablewrap"><table><thead><tr>{(kind === 'Buying' ? ['Date', 'Party', 'Buying Amount / People’s Money', 'Units', 'Payable Profit', 'Rate', 'Due Date', 'Actions'] : kind === 'Selling' ? ['Date', 'Party', 'Trade Amount', 'Units', 'People Used', 'Owner Used', 'Rate', 'Due Date', 'Actions'] : ['Date', 'Type', 'Party', 'Trade Amount', 'Units', 'People / Owner', 'Rate', 'Due Date', 'Actions']).map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(x => {
    const peopleDisplay = x.type === 'Buying' ? x.amount : x.people_funded;
    const payable = x.type === 'Buying' ? x.units * BASE * x.rate : x.people_funded * BASE * x.rate;
    return <tr key={x.id} className="row-animate">
      <td>{x.transaction_date}</td>{kind === 'All' && <td><span className={`tag ${x.type === 'Selling' ? 'sell-tag' : ''}`}>{x.type}</span></td>}<td>{x.party}</td>
      {kind === 'Buying' ? <><td className="strong-money">৳{money(peopleDisplay)}</td><td>{units(x.units)}</td><td className="profit-cell">৳{money(payable)}</td><td>{money(x.rate)}%</td><td>{x.due_date || '—'}</td></> : kind === 'Selling' ? <><td className="strong-money">৳{money(x.amount)}</td><td>{units(x.units)}</td><td>৳{money(x.people_funded)}</td><td>৳{money(x.owner_funded)}</td><td>{money(x.rate)}%</td><td>{x.due_date || '—'}</td></> : <><td className="strong-money">৳{money(x.amount)}</td><td>{units(x.units)}</td><td>৳{money(x.people_funded)} / ৳{money(x.owner_funded)}</td><td>{money(x.rate)}%</td><td>{x.due_date || '—'}</td></>}
      <td><div className="actions"><button onClick={() => onAction('edit', x)}>Edit</button><button onClick={() => onAction('renew', x)}>Renew</button><button className="danger" onClick={() => onDelete(x.id)}>Delete</button></div></td>
    </tr>;
  })}{!rows.length && <tr><td colSpan={9} className="empty">No entries yet.</td></tr>}</tbody></table></div></section>;
}

function EntryModal({ kind, mode, selected, onClose, onSave, saving }: { kind: 'new' | Action; mode: 'Buying' | 'Selling'; selected: Tx | null; onClose: () => void; onSave: (f: HTMLFormElement, k: 'new' | Action) => void; saving: boolean }) {
  const type = selected?.type || mode;
  const isRenew = kind === 'renew';
  return <div className="overlay"><div className="modal"><div className="modalhead"><div><span className="eyebrow">ENTRY LIFECYCLE</span><h2>{kind === 'new' ? `New ${type}` : kind === 'edit' ? 'Edit Entry' : 'Renew Investor Entry'}</h2></div><button onClick={onClose}>Close</button></div>
    {isRenew && <p className="hint">Renew creates a new investor Buying period while keeping the original entry and audit history. Principal must already be fully paid.</p>}
    {kind === 'renew' && selected?.type === 'Selling' && <div className="warn">Selling entries keep the three-action menu for consistency, but Renew is intentionally blocked because renewal must not silently create another trade or consume inventory.</div>}
    <form onSubmit={e => { e.preventDefault(); onSave(e.currentTarget, kind); }} className="form">
      <label>Party<input name="party" defaultValue={selected?.party === '—' ? '' : selected?.party} disabled={kind !== 'new'} required /></label>
      <label>Date<input name="date" type="date" defaultValue={selected?.transaction_date || today()} disabled={kind === 'renew'} required /></label>
      {kind === 'new' && type === 'Buying' ? <label className="full">People’s Money / Buying Amount (৳)<input name="amount" type="number" min="1" step="0.01" required /><small>Buying Amount is the investor principal. Units = Amount ÷ ৳165,000. No second People Funding field.</small></label> : kind === 'new' && type === 'Selling' ? <><label>Units<input name="units" type="number" min="0.0001" step="0.0001" required /></label><label>Trade Amount (৳)<input name="amount" type="number" min="1" step="0.01" required /></label></> : <div className="full info"><b>{selected?.party}</b><br />{selected?.type} · Trade/Principal ৳{money(selected?.amount || 0)} · Units {units(selected?.units || 0)}</div>}
      <label>Rate (%)<input name="rate" type="number" min="0" step="0.01" defaultValue={selected?.rate || 0} /></label>
      <label>Basis<select name="basis" defaultValue={selected?.basis || 'Monthly'}><option>Monthly</option><option>Daily</option></select></label>
      <label>Start Date<input name="start" type="date" defaultValue={selected?.start_date || today()} /></label>
      <label>Due Date<input name="due" type="date" defaultValue={selected?.due_date || ''} /></label>
      <label>End Date<input name="end" type="date" defaultValue={selected?.end_date || ''} /></label>
      <label className="full">Note<textarea name="note" defaultValue={selected?.note || ''} rows={3} /></label>
      <div className="full modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={saving || (kind === 'renew' && selected?.type === 'Selling')}>{saving ? 'Saving…' : kind === 'renew' ? 'Renew Entry' : kind === 'edit' ? 'Save Changes' : `Save ${type}`}</button></div>
    </form>
  </div></div>;
}

function Card({ t, v, s }: { t: string; v: string; s: string }) { return <div className="card"><span>{t}</span><b>{v}</b><small>{s}</small></div>; }

const css = `
*{box-sizing:border-box}.sb{min-height:100vh;display:flex;background:#eef4f1;color:#0a211a;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.sb-loading{min-height:100vh;display:grid;place-items:center;background:#eef4f1;color:#5d746b;font-size:13px;gap:10px}.loader-dot{width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.5);animation:pulse 1.3s infinite}.sb aside{width:238px;min-height:100vh;background:linear-gradient(180deg,#062b22,#0a352a);color:#dceae5;padding:20px 12px;position:sticky;top:0;box-shadow:12px 0 35px rgba(4,33,26,.08)}.brand{display:flex;gap:10px;align-items:center;padding:4px 7px 22px;border-bottom:1px solid #21483e;margin-bottom:12px}.brand>b{width:39px;height:39px;border-radius:12px;background:linear-gradient(135deg,#19d18a,#0c9f69);color:#06291f;display:grid;place-items:center;font-weight:950;box-shadow:0 8px 22px rgba(25,209,138,.2)}.brand span{font-size:12px;font-weight:900}.brand small{display:block;font-size:7px;color:#7e9c93;letter-spacing:.12em;margin-top:4px}.sb aside>button{display:block;width:100%;border:0;background:transparent;color:#91aaa2;text-align:left;padding:10px;border-radius:9px;font-size:10px;cursor:pointer;transition:.2s ease}.sb aside>button.active,.sb aside>button:hover{background:rgba(34,197,139,.13);color:#fff;transform:translateX(2px)}.rules{position:absolute;left:12px;right:12px;bottom:15px;border:1px solid #23483f;background:#0c352c;border-radius:12px;padding:11px;display:grid;gap:5px;font-size:8px;color:#91aaa2}.rules b{color:#fff}.body{flex:1;min-width:0;padding:28px 30px 70px}.body>header{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.body header small,.eyebrow,.section-title{font-size:8px;font-weight:950;letter-spacing:.16em;color:#087f5b}.body h1{margin:6px 0 0;font-size:34px;letter-spacing:-.03em}.head-actions{display:flex;gap:7px}.body header button,.actions button,.modalhead>button{border:1px solid #d5dfdb;background:#fff;border-radius:9px;padding:9px 11px;font-size:9px;cursor:pointer;transition:.2s}.body header button:hover,.actions button:hover,.modalhead>button:hover{transform:translateY(-1px);box-shadow:0 5px 15px rgba(10,38,31,.08)}.primary{background:#087f5b!important;color:#fff;border-color:#087f5b!important;box-shadow:0 8px 20px rgba(8,127,91,.18)}.notice,.error{padding:11px 13px;border-radius:11px;margin-bottom:13px;font-size:9px;animation:slideIn .3s ease}.notice{background:#e8f8f0;color:#067550;border:1px solid #c9ecdc}.error{background:#fff0f1;color:#b42318;border:1px solid #f3c8cc}.hero,.panel,.projection,.card,.total-strip{background:#fff;border:1px solid #dfe8e4;border-radius:17px;box-shadow:0 10px 30px rgba(10,38,31,.05)}.hero{padding:23px;background:radial-gradient(circle at 85% 25%,rgba(24,194,124,.13),transparent 30%),linear-gradient(135deg,#fff,#e8f7f0);display:flex;justify-content:space-between;align-items:center;overflow:hidden;position:relative}.hero:after{content:'';position:absolute;width:180px;height:180px;border-radius:50%;right:-80px;bottom:-90px;border:1px solid rgba(8,127,91,.12);animation:float 5s ease-in-out infinite}.hero h2{font-size:27px;margin:7px 0;letter-spacing:-.035em}.hero p{font-size:10px;color:#667871;margin:0}.pulse{font-size:8px;font-weight:900;color:#087f5b;background:#effaf5;border:1px solid #ccefe0;border-radius:20px;padding:8px 10px;display:flex;gap:6px;align-items:center;z-index:1}.pulse i{width:6px;height:6px;border-radius:50%;background:#10b981;animation:blink 1.4s infinite}.section-title{margin:22px 0 9px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:12px}.card{padding:16px;min-height:112px;transition:.25s ease;animation:rise .45s ease both}.card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(10,38,31,.08);border-color:#c9ddd5}.card span,.card small{display:block}.card span{font-size:9px;color:#63756e}.card b{display:block;font-size:20px;margin:12px 0 6px;letter-spacing:-.025em}.card small{font-size:8px;color:#8a9893}.chart-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:12px}.panel,.projection{padding:17px}.panel h3{font-size:11px;margin:0 0 14px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.panel-head span,.subhead{font-size:8px;color:#899790}.bars{height:205px;display:flex;align-items:end;justify-content:center;gap:60px;border-bottom:1px solid #dfe8e4;padding:15px 20px 0}.bars.tall{height:260px}.bar-wrap{height:100%;width:75px;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:5px}.bar{width:55px;min-height:8px;border-radius:9px 9px 3px 3px;transition:height .7s cubic-bezier(.2,.8,.2,1);animation:grow .7s ease}.buying-bar{background:linear-gradient(180deg,#10b981,#087f5b)}.selling-bar{background:linear-gradient(180deg,#182f29,#526b62)}.bar-wrap b{font-size:8px}.bar-wrap small{font-size:7px;color:#899790}.funding-line{display:flex;justify-content:space-between;gap:10px;padding:13px 0;border-bottom:1px solid #edf1ee;font-size:9px}.funding-line:last-child{border-bottom:0}.funding-line b{font-size:10px}.total-strip{display:grid;grid-template-columns:repeat(3,1fr);margin-top:12px;overflow:hidden}.total-strip div{padding:15px 18px;border-right:1px solid #edf1ee}.total-strip div:last-child{border-right:0}.total-strip span{display:block;font-size:8px;color:#7b8b85}.total-strip b{display:block;margin-top:6px;font-size:13px}.ledger{margin-top:12px}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:9px}th,td{padding:11px;border-bottom:1px solid #edf1ee;text-align:left;white-space:nowrap}th{background:#f5f8f6;color:#62736d;font-size:8px;position:sticky;top:0}.row-animate{animation:rowIn .35s ease both}.tag{background:#e9f8f1;color:#087f5b;border-radius:20px;padding:4px 7px;font-size:8px}.sell-tag{background:#edf1f0;color:#29453c}.strong-money{font-weight:850}.profit-cell{color:#087f5b;font-weight:800}.actions{display:flex;gap:5px}.actions button{padding:6px 8px}.actions .danger{color:#b42318}.actions button:disabled{opacity:.35;cursor:not-allowed}.empty{text-align:center;color:#899790;padding:30px}.projection{margin-top:12px}.seg{display:flex;gap:6px;margin:12px 0}.seg button{border:1px solid #dfe8e4;background:#fff;border-radius:8px;padding:8px 11px;font-size:9px;cursor:pointer}.seg .sel{background:#082c24;color:#fff;border-color:#082c24}.overlay{position:fixed;inset:0;background:rgba(5,25,20,.56);backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px;z-index:50;animation:fade .2s ease}.modal{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 30px 80px rgba(0,0,0,.25);animation:modalIn .25s ease}.modalhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.modalhead h2{margin:5px 0 0;font-size:21px}.form{display:grid;grid-template-columns:1fr 1fr;gap:11px}.form label{font-size:9px;color:#62736d}.form input,.form select,.form textarea{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #d7e1dc;border-radius:9px;font:inherit;font-size:10px;outline:none;transition:.2s}.form input:focus,.form select:focus,.form textarea:focus{border-color:#0c9f69;box-shadow:0 0 0 3px rgba(16,185,129,.09)}.form .full{grid-column:1/-1}.form small,.hint{font-size:8px;color:#087f5b;display:block;margin-top:5px}.info{padding:12px;background:#f2f7f4;border:1px solid #dfe8e4;border-radius:10px;font-size:9px}.warn{background:#fff7e8;color:#8a5a00;border:1px solid #f1d69d;padding:11px;border-radius:10px;font-size:9px;margin-bottom:12px}.modal-actions{display:flex;justify-content:flex-end;gap:7px}.master-ai-fab{position:fixed;right:24px;bottom:24px;background:linear-gradient(135deg,#082c24,#0b4436);color:#fff;border:1px solid #18c27c;border-radius:15px;padding:12px 15px;text-decoration:none;font-size:10px;font-weight:900;box-shadow:0 15px 35px rgba(0,0,0,.2);z-index:40;transition:.25s}.master-ai-fab:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 20px 42px rgba(0,0,0,.24)}.master-ai-fab span{display:block;font-size:7px;color:#9bd7c0;font-weight:500;margin-top:3px}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes rowIn{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:none}}@keyframes slideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}@keyframes modalIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}@keyframes fade{from{opacity:0}to{opacity:1}}@keyframes grow{from{height:8px!important}to{height:var(--h)}}@keyframes pulse{70%{box-shadow:0 0 0 7px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}@keyframes blink{50%{opacity:.3}}@keyframes float{50%{transform:translateY(-8px)}}@media(max-width:1050px){.cards{grid-template-columns:repeat(2,1fr)}.chart-grid{grid-template-columns:1fr}}@media(max-width:700px){.sb aside{display:none}.body{padding:18px 14px 60px}.cards{grid-template-columns:1fr}.form{grid-template-columns:1fr}.form .full{grid-column:auto}.body>header{align-items:flex-start;gap:10px;flex-direction:column}.head-actions{flex-wrap:wrap}.hero{padding:18px}.pulse{display:none}.total-strip{grid-template-columns:1fr}.total-strip div{border-right:0;border-bottom:1px solid #edf1ee}.bars{gap:30px}}
`;
