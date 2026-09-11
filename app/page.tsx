'use client';

import { useEffect, useMemo, useState } from 'react';

type TxType = 'Buying' | 'Selling' | "People's Money";
type Status = 'Paid' | 'Partially Paid' | 'Due Soon' | 'Overdue' | 'Pending';
type Tx = {
  id: string; type: TxType; party: string; date: string; dueDate: string;
  units: number; rate: number; amount: number; paid: number; note: string;
};
type Payment = { id: string; txId: string; amount: number; date: string; note: string };
type AppState = { transactions: Tx[]; payments: Payment[]; capital: number; expenses: number; audit: string[] };

const UNIT_VALUE = 165000;
const MULTIPLIER = 150;
const DIVISOR = 30;
const STORAGE_KEY = 'vehicle-capital-pro';
const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(Math.round(n));
const today = () => new Date().toISOString().slice(0, 10);
const parseDate = (s: string) => new Date(`${s}T00:00:00`);
const inclusiveDays = (a: string, b: string) => Math.max(1, Math.floor((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000) + 1);
const nextMonth = (date: string) => { const d = parseDate(date); const original = d.getDate(); d.setMonth(d.getMonth() + 1); if (d.getDate() !== original) d.setDate(0); return d.toISOString().slice(0, 10); };
const principalForUnits = (units: number) => units * UNIT_VALUE;
const monthlyFor = (units: number, rate: number) => units * MULTIPLIER * rate;
const dailyFor = (units: number, rate: number) => monthlyFor(units, rate) / DIVISOR;
const accruedFor = (tx: Tx, end = today()) => dailyFor(tx.units, tx.rate) * inclusiveDays(tx.date, end);
const statusFor = (tx: Tx): Status => {
  if (tx.paid >= tx.amount) return 'Paid';
  if (tx.paid > 0) return 'Partially Paid';
  const diff = Math.floor((parseDate(tx.dueDate).getTime() - parseDate(today()).getTime()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff <= 4) return 'Due Soon';
  return 'Pending';
};
const uid = () => crypto.randomUUID();

const seed: AppState = {
  capital: 10000000,
  expenses: 0,
  transactions: [
    { id: 'b1', type: 'Buying', party: 'ABC Traders', date: '2026-09-01', dueDate: '2026-10-01', units: 50, rate: 11, amount: principalForUnits(50), paid: 0, note: 'Buying lot' },
    { id: 'b2', type: 'Buying', party: 'Rahman Enterprise', date: '2026-09-05', dueDate: '2026-10-05', units: 100, rate: 10, amount: principalForUnits(100), paid: principalForUnits(100), note: 'Buying lot' },
    { id: 's1', type: 'Selling', party: 'Noman Auto', date: '2026-09-08', dueDate: '2026-10-08', units: 30, rate: 14, amount: principalForUnits(30), paid: principalForUnits(30), note: 'Sale' },
    { id: 's2', type: 'Selling', party: 'Karim Motors', date: '2026-09-05', dueDate: '2026-10-05', units: 80, rate: 15, amount: principalForUnits(80), paid: 0, note: 'Sale' },
    { id: 'p1', type: "People's Money", party: 'AL Trading', date: '2026-09-06', dueDate: '2026-10-06', units: 200, rate: 12, amount: principalForUnits(200), paid: 0, note: 'Monthly return obligation' },
  ],
  payments: [],
  audit: ['System initialized', 'Opening capital recorded: ৳10,000,000'],
};

function loadState(): AppState | null {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default function Page() {
  const [state, setState] = useState<AppState | null>(null);
  const [active, setActive] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'tx' | 'payment' | null>(null);
  const [selectedTx, setSelectedTx] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => setState(loadState() ?? seed), []);
  useEffect(() => { if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  if (!state) return <div className="app"><main className="main"><section className="content"><div className="panel"><h2>Loading ledger…</h2></div></section></main></div>;

  const rows = state.transactions;
  const buying = rows.filter(x => x.type === 'Buying');
  const selling = rows.filter(x => x.type === 'Selling');
  const people = rows.filter(x => x.type === "People's Money");
  const totalBought = buying.reduce((s, x) => s + x.units, 0);
  const totalSold = selling.reduce((s, x) => s + x.units, 0);
  const buyingPrincipal = buying.reduce((s, x) => s + x.amount, 0);
  const revenue = selling.reduce((s, x) => s + x.amount, 0);
  const receivable = selling.reduce((s, x) => s + Math.max(0, x.amount - x.paid), 0);
  const peoplePrincipal = people.reduce((s, x) => s + x.amount, 0);
  const peoplePayable = people.reduce((s, x) => s + Math.max(0, x.amount - x.paid), 0);
  const accruedPeople = people.reduce((s, x) => s + accruedFor(x), 0);
  const fifo = useMemo(() => {
    let remaining = totalSold; let cost = 0;
    for (const lot of [...buying].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) {
      const take = Math.min(remaining, lot.units); cost += take * UNIT_VALUE; remaining -= take;
      if (remaining <= 0) break;
    }
    return { cost, remaining };
  }, [buying, totalSold]);
  const grossProfit = revenue - fifo.cost;
  const netProfit = grossProfit - accruedPeople - state.expenses;
  const alerts = rows.filter(x => ['Due Soon', 'Overdue'].includes(statusFor(x)));
  const filtered = rows.filter(x => `${x.party} ${x.type} ${x.note}`.toLowerCase().includes(query.toLowerCase()));

  const saveTx = (tx: Tx) => { setState(s => s ? ({ ...s, transactions: [...s.transactions, tx], audit: [`Created ${tx.type}: ${tx.party} — ৳${money(tx.amount)}`, ...s.audit].slice(0, 100) }) : s); setModal(null); setNotice('Transaction saved'); };
  const savePayment = (txId: string, amount: number, date: string, note: string) => {
    setState(s => {
      if (!s) return s;
      const target = s.transactions.find(t => t.id === txId); if (!target) return s;
      const nextPaid = Math.min(target.amount, target.paid + amount);
      return { ...s, transactions: s.transactions.map(t => t.id === txId ? { ...t, paid: nextPaid } : t), payments: [...s.payments, { id: uid(), txId, amount, date, note }], audit: [`Payment recorded: ৳${money(amount)} for ${target.party}`, ...s.audit].slice(0, 100) };
    });
    setModal(null); setNotice('Payment recorded');
  };
  const deleteTx = (id: string) => { if (!confirm('Delete this transaction?')) return; setState(s => s ? ({ ...s, transactions: s.transactions.filter(t => t.id !== id), payments: s.payments.filter(p => p.txId !== id), audit: [`Deleted transaction ${id}`, ...s.audit].slice(0, 100) }) : s); };
  const exportData = () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vehicle-capital-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href); };
  const reset = () => { if (confirm('Reset local data to the starter dataset?')) setState(seed); };

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="mark">VC</div><div><strong>Vehicle Capital Pro</strong><span>Units. Capital. Growth.</span></div></div>
      <nav>{['Dashboard','Buying','Selling',"People's Money",'Parties','Capital','Payments','Units','Profit & Loss','Reports','Analytics','Notifications','Settings'].map(n => <button key={n} className={`nav ${active === n ? 'active' : ''}`} onClick={() => setActive(n)}><span>{icon(n)}</span>{n}{n === 'Notifications' && alerts.length > 0 && <b>{alerts.length}</b>}</button>)}</nav>
      <div className="sidebottom">1 Unit = ৳165,000<br/>Multiplier = 150<br/>Daily Divisor = 30<br/><br/>All calculations use exact transaction dates.</div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile"><button className="quiet" onClick={() => setActive('Dashboard')}>VC</button></div><div className="search">⌕<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search parties, transactions, ID or anything..."/><kbd>Ctrl K</kbd></div><div className="topright"><span className="date">{new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span><button className="bell" onClick={() => setActive('Notifications')}>◔{alerts.length > 0 && <i className="dot"/>}</button><div className="user"><div className="avatar">O</div><div><strong>Owner</strong><span>Business Owner</span></div></div></div></header>
      <section className="content">
        {active === 'Dashboard' && <Dashboard capital={state.capital} revenue={revenue} gross={grossProfit} net={netProfit} bought={totalBought} sold={totalSold} buyingPrincipal={buyingPrincipal} peoplePrincipal={peoplePrincipal} receivable={receivable} peoplePayable={accruedPeople} alerts={alerts} rows={rows} onAdd={() => setModal('tx')} />}
        {active === 'Profit & Loss' && <Profit revenue={revenue} fifo={fifo.cost} gross={grossProfit} people={accruedPeople} expenses={state.expenses} net={netProfit} />}
        {active === 'Units' && <Units bought={totalBought} sold={totalSold} />}
        {active === 'Payments' && <Payments rows={rows} payments={state.payments} onAdd={() => { setSelectedTx(rows[0]?.id || ''); setModal('payment'); }} />}
        {active === 'Notifications' && <Notifications alerts={alerts} />}
        {active === 'Parties' && <Parties rows={rows} />}
        {active === 'Settings' && <Settings state={state} onExport={exportData} onReset={reset} />}
        {!['Dashboard','Profit & Loss','Units','Payments','Notifications','Parties','Settings'].includes(active) && <Module active={active} rows={filtered.filter(x => active === 'Capital' ? true : x.type === active || (active === "People's Money" && x.type === active))} onAdd={() => setModal('tx')} onDelete={deleteTx} />}
      </section>
    </main>
    {modal === 'tx' && <TransactionModal onClose={() => setModal(null)} onSave={saveTx} />}
    {modal === 'payment' && <PaymentModal rows={rows} selected={selectedTx} onClose={() => setModal(null)} onSave={savePayment} />}
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
  </div>;
}

function icon(n: string) { const m: Record<string,string> = {Dashboard:'⌂',Buying:'↓',Selling:'↑',"People's Money":'◈',Parties:'◎',Capital:'◫',Payments:'৳',Units:'▦','Profit & Loss':'↗',Reports:'▤',Analytics:'◒',Notifications:'◔',Settings:'⚙'}; return m[n] || '•'; }
function Metric({title,value,sub}:{title:string,value:any,sub:string}) { return <div className="metric"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>; }
function Panel({title,children}:{title:string,children:React.ReactNode}) { return <div className="panel"><div className="panelhead"><h2>{title}</h2></div>{children}</div>; }
function Pay({label,value,tone}:{label:string,value:any,tone:string}) { return <div className="payrow"><span><i className={`status ${tone}`}/>{label}</span><strong>{value}</strong></div>; }

function Dashboard(p:any) { return <>
  <div className="head"><div><p className="eyebrow">OWNER CONTROL CENTER</p><h1>Business position</h1><p>Principal, returns, units and profit — calculated from the ledger.</p></div><button className="primary" onClick={p.onAdd}>+ New transaction</button></div>
  <div className="metrics"><Metric title="Opening Capital" value={`৳${money(p.capital)}`} sub="Owner capital"/><Metric title="Available Capital" value={`৳${money(Math.max(0,p.capital-p.buyingPrincipal+p.receivable))}`} sub="After principal movement"/><Metric title="Capital Used" value={`৳${money(Math.max(0,p.buyingPrincipal-p.receivable))}`} sub="Current business use"/><Metric title="People's Money" value={`৳${money(p.peoplePrincipal)}`} sub="Principal balance"/></div>
  <div className="metrics second"><Metric title="Total Buying" value={`৳${money(p.buyingPrincipal)}`} sub={`${p.bought} units`}/><Metric title="Total Selling" value={`৳${money(p.revenue)}`} sub={`${p.sold} units`}/><Metric title="Gross Profit" value={`৳${money(p.gross)}`} sub="Selling − FIFO cost"/><Metric title="Net Profit" value={`৳${money(p.net)}`} sub="After accrued people returns"/><Metric title="Alerts" value={p.alerts.length} sub="Due soon / overdue"/></div>
  <div className="grid3"><Panel title="Units Overview"><div className="donutwrap"><div className="donut"><strong>{money(p.bought)}</strong><span>Total Bought</span></div><div><Pay label="Bought Units" value={p.bought} tone="green"/><Pay label="Sold Units" value={p.sold} tone="amber"/><Pay label="Available" value={Math.max(0,p.bought-p.sold)} tone="red"/></div></div></Panel><Panel title="Capital Utilization"><div style={{padding:'12px 0'}}><strong>{Math.min(100,Math.round((p.buyingPrincipal/Math.max(1,p.capital))*100))}% Used</strong><div className="progress"><i style={{width:`${Math.min(100,(p.buyingPrincipal/Math.max(1,p.capital))*100)}%`}}/></div><Pay label="Buying principal" value={`৳${money(p.buyingPrincipal)}`} tone="green"/><Pay label="Receivable" value={`৳${money(p.receivable)}`} tone="green"/></div></Panel><Panel title="Payment Overview"><Pay label="Total Receivable" value={`৳${money(p.receivable)}`} tone="green"/><Pay label="People accrued payable" value={`৳${money(p.peoplePayable)}`} tone="amber"/><Pay label="Due / overdue" value={p.alerts.length} tone="red"/></Panel></div>
  <div className="gridbottom"><Panel title="Buying vs Selling"><div className="bars"><div className="bar" style={{height:`${Math.min(100,p.buyingPrincipal/Math.max(1,p.revenue)*70)}%`}}/><div className="bar two" style={{height:'70%'}}/></div><div className="chartlabels"><span>Buying</span><span>Selling</span></div></Panel><Panel title="Alerts">{p.alerts.slice(0,6).map((x:any)=><div className="payrow" key={x.id}><span>{x.party}</span><strong>{statusFor(x)}</strong></div>)}{!p.alerts.length&&<p>No upcoming alerts.</p>}</Panel></div>
  <div className="panel" style={{marginTop:10}}><div className="panelhead"><h2>Recent Transactions</h2></div><TxTable rows={p.rows.slice(-8).reverse()}/></div>
</>; }

function Module({active,rows,onAdd,onDelete}:{active:string,rows:Tx[],onAdd:()=>void,onDelete:(id:string)=>void}) { return <><div className="head"><div><p className="eyebrow">LEDGER MODULE</p><h1>{active}</h1><p>Principal amount = Units × ৳165,000. Rate drives monthly return.</p></div><button className="primary" onClick={onAdd}>+ Add transaction</button></div><div className="module">{rows.length ? <TxTable rows={rows} onDelete={onDelete}/> : <p>No records.</p>}</div></>; }
function TxTable({rows,onDelete}:{rows:Tx[],onDelete?:(id:string)=>void}) { return <div className="tablewrap"><table className="table"><thead><tr><th>ID</th><th>Date</th><th>Type</th><th>Party</th><th>Units</th><th>Amount</th><th>Rate</th><th>Monthly</th><th>Daily</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.id.slice(0,8)}</td><td>{x.date}</td><td><span className="pill">{x.type}</span></td><td>{x.party}</td><td>{x.units.toFixed(2)}</td><td>৳{money(x.amount)}</td><td>{x.rate}%</td><td>৳{money(monthlyFor(x.units,x.rate))}</td><td>৳{money(dailyFor(x.units,x.rate))}</td><td><span className={`badge ${statusFor(x).replaceAll(' ','-').toLowerCase()}`}>{statusFor(x)}</span></td><td>{onDelete&&<button className="quiet" onClick={()=>onDelete(x.id)}>Delete</button>}</td></tr>)}</tbody></table></div>; }

function Profit(p:any) { return <><div className="head"><div><p className="eyebrow">FINANCIAL RESULT</p><h1>Profit & Loss</h1><p>FIFO uses the oldest buying units first. People’s Money is accrued using the exact daily formula.</p></div></div><div className="metrics"><Metric title="Revenue" value={`৳${money(p.revenue)}`} sub="Selling principal"/><Metric title="FIFO Cost" value={`৳${money(p.fifo)}`} sub="Oldest lots first"/><Metric title="Gross Profit" value={`৳${money(p.gross)}`} sub="Revenue − FIFO"/><Metric title="People Returns" value={`৳${money(p.people)}`} sub="Accrued obligation"/><Metric title="Net Profit" value={`৳${money(p.net)}`} sub="After returns + expenses"/></div><div className="panel"><h2>Calculation rules</h2><p>Principal = Units × ৳165,000</p><p>Monthly return = Units × 150 × Rate</p><p>Daily return = Monthly return ÷ 30</p><p>Period return = Daily return × inclusive calendar days</p></div></>; }
function Units(p:any) { const available=Math.max(0,p.bought-p.sold); return <><div className="head"><div><p className="eyebrow">UNIT CONTROL</p><h1>Units</h1></div></div><div className="metrics"><Metric title="Bought" value={p.bought} sub="Total acquired"/><Metric title="Sold" value={p.sold} sub="Total allocated"/><Metric title="Available" value={available} sub="Remaining units"/></div><div className="panel"><h2>Unit conversion</h2><p>1 Unit = ৳165,000</p><p>100 Units = ৳{money(100*UNIT_VALUE)}</p></div></>; }
function Notifications({alerts}:{alerts:Tx[]}) { return <><div className="head"><div><p className="eyebrow">ALERT CENTER</p><h1>Notifications</h1></div></div><div className="panel">{alerts.length?alerts.map(x=><div className="payrow" key={x.id}><span>{x.party} — due {x.dueDate}</span><strong>{statusFor(x)}</strong></div>):<p>No due-soon or overdue transactions.</p>}</div></>; }
function Parties({rows}:{rows:Tx[]}) { const names=[...new Set(rows.map(x=>x.party))]; return <><div className="head"><div><p className="eyebrow">PARTY MASTER</p><h1>Parties</h1></div></div><div className="module">{names.map(name=><div className="payrow" key={name}><span>{name}</span><strong>{rows.filter(x=>x.party===name).length} transactions</strong></div>)}</div></>; }
function Payments({rows,payments,onAdd}:{rows:Tx[],payments:Payment[],onAdd:()=>void}) { return <><div className="head"><div><p className="eyebrow">PAYMENT CENTER</p><h1>Payments</h1></div><button className="primary" onClick={onAdd}>+ Record payment</button></div><div className="module"><TxTable rows={rows}/><div style={{marginTop:18}}><h2>Payment history</h2>{payments.length?payments.slice().reverse().map(p=><div className="payrow" key={p.id}><span>{p.date} — {rows.find(x=>x.id===p.txId)?.party||'Unknown'}</span><strong>৳{money(p.amount)}</strong></div>):<p>No payments recorded.</p>}</div></div></>; }
function Settings({state,onExport,onReset}:{state:AppState,onExport:()=>void,onReset:()=>void}) { return <><div className="head"><div><p className="eyebrow">SYSTEM</p><h1>Settings</h1></div></div><div className="panel"><h2>Business formulas</h2><p>Unit value: ৳165,000</p><p>Multiplier: 150</p><p>Daily divisor: 30</p><p>Opening capital: ৳{money(state.capital)}</p><button className="secondary" onClick={onExport}>Export backup</button> <button className="quiet" onClick={onReset}>Reset demo data</button></div></>; }

function TransactionModal({onClose,onSave}:{onClose:()=>void,onSave:(tx:Tx)=>void}) {
  const [type,setType]=useState<TxType>('Buying'); const [party,setParty]=useState(''); const [date,setDate]=useState(today()); const [units,setUnits]=useState('1'); const [rate,setRate]=useState('10'); const [paid,setPaid]=useState('0'); const [note,setNote]=useState('');
  const u=Math.max(0,Number(units)||0); const r=Math.max(0,Number(rate)||0); const amount=principalForUnits(u); const monthly=monthlyFor(u,r); const daily=dailyFor(u,r);
  const submit=(e:React.FormEvent)=>{e.preventDefault(); if(!party.trim()||u<=0)return; onSave({id:uid(),type,party:party.trim(),date,dueDate:nextMonth(date),units:u,rate:r,amount,paid:Math.min(amount,Math.max(0,Number(paid)||0)),note});};
  return <div className="modalbg"><form className="modal" onSubmit={submit}><div className="panelhead"><h2>New {type}</h2><button type="button" className="quiet" onClick={onClose}>Close</button></div><div className="form"><label>Type<select value={type} onChange={e=>setType(e.target.value as TxType)}><option>Buying</option><option>Selling</option><option>People's Money</option></select></label><label>Party<input value={party} onChange={e=>setParty(e.target.value)} placeholder="Party name" required/></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Units<input type="number" min="0.01" step="0.01" value={units} onChange={e=>setUnits(e.target.value)}/></label><label>Rate (%)<input type="number" min="0" step="0.01" value={rate} onChange={e=>setRate(e.target.value)}/></label><label>Initial payment<input type="number" min="0" step="1" value={paid} onChange={e=>setPaid(e.target.value)}/></label><label>Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note"/></label></div><div className="calcbox"><div><span>Principal amount</span><strong>৳{money(amount)}</strong></div><div><span>Monthly return</span><strong>৳{money(monthly)}</strong></div><div><span>Daily return</span><strong>৳{money(daily)}</strong></div><small>Principal = Units × ৳165,000 · Monthly = Units × 150 × Rate · Daily = Monthly ÷ 30</small></div><button className="primary" type="submit">Save transaction</button></form></div>;
}

function PaymentModal({rows,selected,onClose,onSave}:{rows:Tx[],selected:string,onClose:()=>void,onSave:(id:string,amount:number,date:string,note:string)=>void}) { const [txId,setTxId]=useState(selected||rows[0]?.id||''); const [amount,setAmount]=useState(''); const [date,setDate]=useState(today()); const [note,setNote]=useState(''); const tx=rows.find(x=>x.id===txId); return <div className="modalbg"><form className="modal" onSubmit={e=>{e.preventDefault(); const a=Number(amount); if(tx&&a>0)onSave(txId,a,date,note);}}><div className="panelhead"><h2>Record Payment</h2><button type="button" className="quiet" onClick={onClose}>Close</button></div><div className="form"><label>Transaction<select value={txId} onChange={e=>setTxId(e.target.value)}>{rows.map(x=><option key={x.id} value={x.id}>{x.party} — ৳{money(x.amount)}</option>)}</select></label><label>Amount<input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} required/></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Note<input value={note} onChange={e=>setNote(e.target.value)}/></label></div>{tx&&<div className="calcbox"><div><span>Principal</span><strong>৳{money(tx.amount)}</strong></div><div><span>Already paid</span><strong>৳{money(tx.paid)}</strong></div><div><span>Remaining</span><strong>৳{money(Math.max(0,tx.amount-tx.paid))}</strong></div></div>}<button className="primary" type="submit">Record payment</button></form></div>; }
