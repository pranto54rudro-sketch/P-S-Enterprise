'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { amountFromUnits, monthlyReturn, inclusiveDays } from '@/lib/financial';

type Mode = 'Buying' | 'Selling';
type Tx = {
  id: string; type: Mode; party: string; transaction_date: string; due_date: string | null;
  start_date: string; end_date: string | null; units: number; rate: number; amount: number;
  paid: number; owner_funded: number; people_funded: number; realized_profit: number; basis: string;
};
type Party = { id: string; name: string; phone: string | null; address: string | null };
type Lot = { id: string; transaction_id: string; lot_date: string; units: number; unit_cost: number; owner_units: number; people_units: number };
type Payment = { id: string; transaction_id: string; payment_type: string; direction: string; amount: number; payment_date: string; note: string | null };

const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(n || 0);
const unitsFmt = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 4 }).format(n || 0);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

function txStatus(t: Tx) {
  const due = Math.max(0, t.amount - t.paid);
  if (due <= 0.01) return 'Paid';
  if (t.paid > 0) return 'Partially Paid';
  if (!t.due_date) return 'Pending';
  const days = inclusiveDays(today(), t.due_date) - 1;
  return days < 0 ? 'Overdue' : days <= 4 ? 'Due Soon' : 'Pending';
}

export default function SecondaryBusiness() {
  const supabase = createClient();
  const [active, setActive] = useState('Dashboard');
  const [txs, setTxs] = useState<Tx[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [opening, setOpening] = useState(10000000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'transaction' | 'party' | 'payment' | null>(null);
  const [mode, setMode] = useState<Mode>('Buying');

  const load = async () => {
    setLoading(true);
    setError('');
    const [t, p, l, pm, s] = await Promise.all([
      supabase.from('transactions').select('*,parties(name)').order('transaction_date', { ascending: false }),
      supabase.from('parties').select('*').order('name'),
      supabase.from('buying_lots').select('*').order('lot_date'),
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('business_settings').select('opening_capital').limit(1).single(),
    ]);
    const firstError = [t, p, l, pm, s].find((x: any) => x.error)?.error;
    if (firstError) setError(firstError.message);
    if (t.data) setTxs(t.data.map((x: any) => ({
      ...x, party: x.parties?.name || '—', units: +x.units, rate: +x.rate, amount: +x.amount,
      paid: +x.paid, owner_funded: +x.owner_funded, people_funded: +x.people_funded,
      realized_profit: +x.realized_profit, basis: x.basis || 'Monthly',
    })));
    if (p.data) setParties(p.data);
    if (l.data) setLots(l.data.map((x: any) => ({ ...x, units: +x.units, unit_cost: +x.unit_cost, owner_units: +x.owner_units, people_units: +x.people_units })));
    if (pm.data) setPayments(pm.data.map((x: any) => ({ ...x, amount: +x.amount })));
    if (!s.error) setOpening(+s.data.opening_capital);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('secondary-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buying_lots' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const buying = txs.filter(x => x.type === 'Buying');
  const selling = txs.filter(x => x.type === 'Selling');
  const buyValue = buying.reduce((a, x) => a + x.amount, 0);
  const sellValue = selling.reduce((a, x) => a + x.amount, 0);
  const boughtUnits = buying.reduce((a, x) => a + x.units, 0);
  const soldUnits = selling.reduce((a, x) => a + x.units, 0);
  const ownerBuying = buying.reduce((a, x) => a + x.owner_funded, 0);
  const peopleMoney = buying.reduce((a, x) => a + x.people_funded, 0);
  const ownerUnits = lots.reduce((a, x) => a + x.owner_units, 0);
  const peopleUnits = lots.reduce((a, x) => a + x.people_units, 0);
  const gross = selling.reduce((a, x) => a + x.realized_profit, 0);
  // People’s Money is stored as a BDT principal amount; convert it to units before applying Units × 150 × Rate.
  const peopleReturn = buying.reduce((a, x) => a + (x.people_funded ? monthlyReturn(x.people_funded / 165000, x.rate) / 30 * inclusiveDays(x.start_date, x.end_date || today()) : 0), 0);
  const net = gross - peopleReturn;
  const availableCapital = Math.max(0, opening - ownerBuying);
  const alerts = txs.filter(x => ['Due Soon', 'Overdue'].includes(txStatus(x)));

  const saveTransaction = async (form: HTMLFormElement) => {
    setSaving(true); setError(''); setNotice('');
    const f = new FormData(form);
    const type = String(f.get('type')) as Mode;
    const party = String(f.get('party') || '').trim();
    const units = Number(f.get('units')) || 0;
    const amount = Number(f.get('amount')) || amountFromUnits(units);
    const peopleFund = type === 'Buying' ? Number(f.get('peopleFund')) || 0 : 0;
    const ownerFund = type === 'Buying' ? amount - peopleFund : 0;
    if (!party || units <= 0 || amount <= 0) { setError('Party, units and amount are required.'); setSaving(false); return; }
    if (type === 'Buying' && (peopleFund < 0 || peopleFund > amount)) { setError('People’s Money must be between 0 and the total amount.'); setSaving(false); return; }
    const { error: rpcError } = await supabase.rpc('create_financial_transaction', {
      p_type: type,
      p_party_name: party,
      p_party_phone: String(f.get('phone') || ''),
      p_party_address: String(f.get('address') || ''),
      p_transaction_date: String(f.get('date') || today()),
      p_due_date: String(f.get('due') || '') || null,
      p_units: units,
      p_rate: Number(f.get('rate')) || 0,
      p_amount: amount,
      p_owner_funded: ownerFund,
      p_people_funded: peopleFund,
      p_note: String(f.get('note') || ''),
      p_basis: String(f.get('basis') || 'Monthly'),
      p_start_date: String(f.get('start') || f.get('date') || today()),
      p_end_date: String(f.get('end') || '') || null,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setModal(null);
      setNotice(`${type} saved successfully.`);
      await load();
    }
    setSaving(false);
  };

  const saveParty = async (form: HTMLFormElement) => {
    setSaving(true); setError('');
    const f = new FormData(form);
    const name = String(f.get('name') || '').trim();
    if (!name) { setError('Party name is required.'); setSaving(false); return; }
    const { error: e } = await supabase.from('parties').upsert({ name, phone: String(f.get('phone') || '') || null, address: String(f.get('address') || '') || null }, { onConflict: 'name' });
    if (e) setError(e.message); else { setModal(null); setNotice('Party saved successfully.'); await load(); }
    setSaving(false);
  };

  const savePayment = async (form: HTMLFormElement) => {
    setSaving(true); setError('');
    const f = new FormData(form);
    const tx = txs.find(x => x.id === String(f.get('transaction')));
    if (!tx) { setError('Select a transaction.'); setSaving(false); return; }
    const kind = String(f.get('kind') || 'principal');
    const amount = Number(f.get('amount')) || 0;
    if (amount <= 0) { setError('Payment amount must be greater than 0.'); setSaving(false); return; }
    const direction = tx.type === 'Selling' && kind === 'principal' ? 'received' : 'paid';
    const { error: e } = await supabase.rpc('record_financial_payment', {
      p_transaction_id: tx.id,
      p_payment_type: kind,
      p_direction: direction,
      p_amount: amount,
      p_payment_date: String(f.get('date') || today()),
      p_note: String(f.get('note') || ''),
    });
    if (e) setError(e.message); else { setModal(null); setNotice('Payment saved successfully.'); await load(); }
    setSaving(false);
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction? Paid transactions cannot be deleted.')) return;
    setError('');
    const { error: e } = await supabase.rpc('delete_financial_transaction', { p_transaction_id: id });
    if (e) setError(e.message); else { setNotice('Transaction deleted.'); await load(); }
  };

  const nav = ['Dashboard', 'Buying', 'Selling', "People's Money", 'Parties', 'Capital', 'Payments', 'Units', 'Profit & Loss', 'Reports', 'Analytics', 'Notifications', 'Settings'];
  const recent = useMemo(() => [...txs].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)), [txs]);

  if (loading) return <div className="app"><main className="main"><section className="content"><div className="panel"><h2>Loading A P Traders live ledger…</h2></div></section></main></div>;

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="mark">AP</div><div><strong>A P Traders</strong><span>Secondary Business</span></div></div>
      <nav>{nav.map(n => <button className={`nav ${active === n ? 'active' : ''}`} key={n} onClick={() => setActive(n)}>{n}{n === 'Notifications' && alerts.length > 0 && <b>{alerts.length}</b>}</button>)}</nav>
      <div className="sidebottom"><strong>Calculation Engine</strong><br />1 Unit = ৳165,000<br />Monthly = Units × 150 × Rate<br />Daily = Monthly ÷ 30<br />FIFO = oldest buying lot first</div>
    </aside>
    <main className="main">
      <header className="topbar"><div><strong>A P TRADERS</strong><span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 10 }}>SECONDARY BUSINESS · LIVE</span></div><div className="topright"><span className="date">{today()}</span><button className="secondary" onClick={load}>Refresh</button></div></header>
      <section className="content">
        <div className="head"><div><p className="eyebrow">SECONDARY BUSINESS</p><h1>{active}</h1><p>Centralized capital, units, buying, selling, People’s Money and profit.</p></div><div className="actions">
          {active === 'Buying' && <button className="primary" onClick={() => { setMode('Buying'); setModal('transaction'); }}>+ New Buying</button>}
          {active === 'Selling' && <button className="primary" onClick={() => { setMode('Selling'); setModal('transaction'); }}>+ New Selling</button>}
          {active === 'Parties' && <button className="primary" onClick={() => setModal('party')}>+ New Party</button>}
          {active === 'Payments' && <button className="primary" onClick={() => setModal('payment')}>+ Payment</button>}
        </div></div>
        {error && <div className="panel" style={{ marginBottom: 12, borderColor: 'var(--red)' }}><p style={{ color: 'var(--red)' }}>{error}</p><button className="secondary" onClick={() => setError('')}>Dismiss</button></div>}
        {notice && <div className="panel" style={{ marginBottom: 12, borderColor: 'var(--green)' }}><p style={{ color: 'var(--green)' }}>{notice}</p><button className="secondary" onClick={() => setNotice('')}>Dismiss</button></div>}

        {active === 'Dashboard' && <>
          <div className="metrics">{[
            ['Opening Capital', opening, 'Owner capital'], ['Owner Capital Used', ownerBuying, 'Buying deployed'], ['Available Capital', availableCapital, 'Not deployed'], ['People’s Money', peopleMoney, 'Linked funding'],
            ['Total Buying', buyValue, 'Buying turnover'], ['Total Selling', sellValue, 'Selling turnover'], ['Realized Selling Profit', gross, 'FIFO realized profit'], ['Net Profit', net, 'After People’s Money return']
          ].map(([label, value, sub]) => <div className="metric" key={String(label)}><span>{label}</span><strong>৳{money(Number(value))}</strong><small>{sub}</small></div>)}</div>
          <div className="grid3">
            <section className="panel"><div className="panelhead"><h2>Buying vs Selling</h2></div><div className="bars"><i className="bar" style={{ height: `${Math.max(5, buyValue / Math.max(buyValue, sellValue, 1) * 100)}%` }} /><i className="bar two" style={{ height: `${Math.max(5, sellValue / Math.max(buyValue, sellValue, 1) * 100)}%` }} /></div><div className="chartlabels"><span>Buying ৳{money(buyValue)}</span><span>Selling ৳{money(sellValue)}</span></div></section>
            <section className="panel"><div className="panelhead"><h2>Capital Utilization</h2></div><div className="metric"><strong>{(ownerBuying / (opening || 1) * 100).toFixed(1)}%</strong><small>Owner capital deployed</small></div><div className="progress"><i style={{ width: `${Math.min(100, ownerBuying / (opening || 1) * 100)}%` }} /></div><p>Available: ৳{money(availableCapital)}</p></section>
            <section className="panel"><div className="panelhead"><h2>Unit Position</h2></div><div className="payrow"><span>Owner inventory</span><strong>{unitsFmt(ownerUnits)}</strong></div><div className="payrow"><span>People’s Money inventory</span><strong>{unitsFmt(peopleUnits)}</strong></div><div className="payrow"><span>Bought</span><strong>{unitsFmt(boughtUnits)}</strong></div><div className="payrow"><span>Sold</span><strong>{unitsFmt(soldUnits)}</strong></div></section>
          </div>
          <section className="panel"><div className="panelhead"><h2>Recent Transactions</h2></div><TransactionTable rows={recent.slice(0, 15)} onDelete={deleteTransaction} /></section>
        </>}
        {active === 'Buying' && <section className="panel"><div className="panelhead"><h2>Buying Ledger</h2><button className="primary" onClick={() => { setMode('Buying'); setModal('transaction'); }}>+ New Buying</button></div><TransactionTable rows={buying} onDelete={deleteTransaction} /></section>}
        {active === 'Selling' && <section className="panel"><div className="panelhead"><h2>Selling Ledger</h2><button className="primary" onClick={() => { setMode('Selling'); setModal('transaction'); }}>+ New Selling</button></div><TransactionTable rows={selling} onDelete={deleteTransaction} /></section>}
        {active === "People's Money" && <section className="panel"><div className="panelhead"><h2>People’s Money</h2></div>{buying.filter(x => x.people_funded > 0).map(x => <div className="payrow" key={x.id}><span>{x.party}<small>Principal ৳{money(x.people_funded)} · Rate {x.rate} · {x.start_date} → {x.end_date || 'Open'}</small></span><strong>৳{money(monthlyReturn(x.people_funded / 165000, x.rate) / 30 * inclusiveDays(x.start_date, x.end_date || today()))}</strong></div>)}</section>}
        {active === 'Parties' && <section className="panel"><div className="panelhead"><h2>Parties</h2><button className="primary" onClick={() => setModal('party')}>+ New Party</button></div>{parties.map(p => <div className="payrow" key={p.id}><span>{p.name}<small>{p.phone || 'No phone'} · {p.address || 'No address'}</small></span><strong>{txs.filter(x => x.party === p.name).length} transactions</strong></div>)}</section>}
        {active === 'Payments' && <section className="panel"><div className="panelhead"><h2>Payments</h2><button className="primary" onClick={() => setModal('payment')}>+ Payment</button></div>{payments.map(p => <div className="payrow" key={p.id}><span>{txs.find(t => t.id === p.transaction_id)?.party || '—'}<small>{p.payment_type} · {p.payment_date} · {p.direction}</small></span><strong>৳{money(p.amount)}</strong></div>)}</section>}
        {active === 'Units' && <section className="panel"><h2>Units Position</h2><div className="metrics"><div className="metric"><span>Owner Units</span><strong>{unitsFmt(ownerUnits)}</strong></div><div className="metric"><span>People’s Money Units</span><strong>{unitsFmt(peopleUnits)}</strong></div><div className="metric"><span>Bought Units</span><strong>{unitsFmt(boughtUnits)}</strong></div><div className="metric"><span>Sold Units</span><strong>{unitsFmt(soldUnits)}</strong></div></div></section>}
        {active === 'Profit & Loss' && <section className="panel"><h2>Profit & Loss</h2><div className="metrics"><div className="metric"><span>Selling Revenue</span><strong>৳{money(sellValue)}</strong></div><div className="metric"><span>Realized Selling Profit</span><strong>৳{money(gross)}</strong></div><div className="metric"><span>People’s Money Return</span><strong>৳{money(peopleReturn)}</strong></div><div className="metric"><span>Net Profit</span><strong>৳{money(net)}</strong></div></div></section>}
        {active === 'Analytics' && <section className="grid3"><section className="panel"><h2>Selling / Buying</h2><p style={{ fontSize: 24, color: 'var(--text)' }}>{(sellValue / (buyValue || 1)).toFixed(2)}×</p></section><section className="panel"><h2>Profit Margin</h2><p style={{ fontSize: 24, color: 'var(--text)' }}>{(gross / (sellValue || 1) * 100).toFixed(1)}%</p></section><section className="panel"><h2>Sell-through</h2><p style={{ fontSize: 24, color: 'var(--text)' }}>{(soldUnits / (boughtUnits || 1) * 100).toFixed(1)}%</p></section></section>}
        {active === 'Notifications' && <section className="panel"><h2>Notifications</h2>{alerts.length === 0 ? <p>No due alerts.</p> : alerts.map(x => <div className="payrow" key={x.id}><span><span className={`status ${txStatus(x) === 'Overdue' ? 'red' : 'amber'}`} />{x.party}<small>{txStatus(x)} · Due {x.due_date || '—'}</small></span><strong>৳{money(Math.max(0, x.amount - x.paid))}</strong></div>)}</section>}
        {(active === 'Reports' || active === 'Capital' || active === 'Settings') && <section className="panel"><h2>{active}</h2><p>{active === 'Capital' ? `Opening capital is ৳${money(opening)}. Owner buying deployed is ৳${money(ownerBuying)} and available owner capital is ৳${money(availableCapital)}.` : active === 'Reports' ? 'All figures above are calculated from the centralized Supabase ledger.' : 'Calculation rules: 1 Unit = ৳165,000 · Multiplier = 150 · Daily divisor = 30.'}</p></section>}
      </section>
    </main>
    {modal === 'transaction' && <TransactionModal mode={mode} parties={parties} saving={saving} onClose={() => setModal(null)} onSave={saveTransaction} />}
    {modal === 'party' && <PartyModal saving={saving} onClose={() => setModal(null)} onSave={saveParty} />}
    {modal === 'payment' && <PaymentModal rows={txs} saving={saving} onClose={() => setModal(null)} onSave={savePayment} />}
  </div>;
}

function TransactionTable({ rows, onDelete }: { rows: Tx[]; onDelete: (id: string) => void }) {
  return <div className="tablewrap"><table className="table"><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Units</th><th>Amount</th><th>Rate</th><th>Basis</th><th>Status</th><th>Profit</th><th>Action</th></tr></thead><tbody>{rows.map(x => <tr key={x.id}><td>{x.transaction_date}</td><td>{x.type}</td><td>{x.party}</td><td>{unitsFmt(x.units)}</td><td>৳{money(x.amount)}</td><td>{x.rate}</td><td>{x.basis}</td><td><span className={`badge ${txStatus(x).toLowerCase().replaceAll(' ', '-')}`}>{txStatus(x)}</span></td><td>{x.type === 'Selling' ? `৳${money(x.realized_profit)}` : '—'}</td><td><button className="secondary" onClick={() => onDelete(x.id)}>Delete</button></td></tr>)}</tbody></table></div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modalbg"><div className="modal"><div className="panelhead"><h2>{title}</h2><button className="secondary" onClick={onClose}>Close</button></div>{children}</div></div>;
}

function TransactionModal({ mode, parties, saving, onClose, onSave }: { mode: Mode; parties: Party[]; saving: boolean; onClose: () => void; onSave: (form: HTMLFormElement) => void }) {
  const [party, setParty] = useState('');
  const [units, setUnits] = useState('');
  const [amount, setAmount] = useState('');
  const setU = (v: string) => { setUnits(v); setAmount(v ? String(Number(v) * 165000) : ''); };
  const setA = (v: string) => { setAmount(v); setUnits(v ? String(Number(v) / 165000) : ''); };
  return <Modal title={`New ${mode}`} onClose={onClose}><form className="form" onSubmit={e => { e.preventDefault(); onSave(e.currentTarget); }}>
    <input type="hidden" name="type" value={mode} />
    <label>Party Name<input name="party" list="party-options" value={party} onChange={e => setParty(e.target.value)} placeholder="Select or type party name" autoComplete="off" required /></label>
    <datalist id="party-options">{parties.map(p => <option key={p.id} value={p.name} />)}</datalist>
    <label>Phone<input name="phone" placeholder="Optional" /></label>
    <label>Address<input name="address" placeholder="Optional" /></label>
    <label>Units<input name="units" type="number" step="0.0001" min="0.0001" value={units} onChange={e => setU(e.target.value)} required /></label>
    <label>Amount<input name="amount" type="number" step="0.01" min="0.01" value={amount} onChange={e => setA(e.target.value)} required /></label>
    <label>Rate<input name="rate" type="number" step="0.01" min="0" defaultValue="10" required /></label>
    <label>Basis<select name="basis" defaultValue="Monthly"><option>Monthly</option><option>Daily</option></select></label>
    <label>Transaction Date<input name="date" type="date" defaultValue={today()} required /></label>
    <label>Due Date<input name="due" type="date" /></label>
    <label>Start Date<input name="start" type="date" defaultValue={today()} /></label>
    <label>End Date<input name="end" type="date" /></label>
    {mode === 'Buying' && <label>People’s Money<input name="peopleFund" type="number" step="0.01" min="0" defaultValue="0" placeholder="0" /></label>}
    <label>Note<input name="note" placeholder="Optional note" /></label>
    <div style={{ gridColumn: '1/-1' }}><div className="calcbox"><div><span>1 Unit</span><strong>৳165,000</strong></div><div><span>Units</span><strong>{unitsFmt(Number(units) || 0)}</strong></div><div><span>Amount</span><strong>৳{money(Number(amount) || 0)}</strong></div><div><span>Basis</span><strong>Monthly / Daily</strong></div><small>Party stays selected while Units and Amount are edited. Saving uses the secure Supabase financial transaction engine. Selling automatically consumes the oldest available buying lots first.</small></div></div>
    <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : `Save ${mode}`}</button></div>
  </form></Modal>;
}

function PartyModal({ saving, onClose, onSave }: { saving: boolean; onClose: () => void; onSave: (form: HTMLFormElement) => void }) {
  return <Modal title="New Party" onClose={onClose}><form className="form" onSubmit={e => { e.preventDefault(); onSave(e.currentTarget); }}><label>Name<input name="name" required autoFocus /></label><label>Phone<input name="phone" /></label><label>Address<input name="address" /></label><div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Party'}</button></div></form></Modal>;
}

function PaymentModal({ rows, saving, onClose, onSave }: { rows: Tx[]; saving: boolean; onClose: () => void; onSave: (form: HTMLFormElement) => void }) {
  return <Modal title="Record Payment" onClose={onClose}><form className="form" onSubmit={e => { e.preventDefault(); onSave(e.currentTarget); }}><label>Transaction<select name="transaction" required defaultValue=""><option value="" disabled>Select transaction</option>{rows.map(x => <option key={x.id} value={x.id}>{x.type} · {x.party} · ৳{money(x.amount)}</option>)}</select></label><label>Payment Type<select name="kind" defaultValue="principal"><option value="principal">Principal</option><option value="return">People’s Money Return</option></select></label><label>Amount<input name="amount" type="number" step="0.01" min="0.01" required /></label><label>Date<input name="date" type="date" defaultValue={today()} required /></label><label style={{ gridColumn: '1/-1' }}>Note<input name="note" /></label><div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Payment'}</button></div></form></Modal>;
}
