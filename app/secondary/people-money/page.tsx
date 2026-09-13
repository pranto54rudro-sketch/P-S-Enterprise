'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(Number(n) || 0);
const units = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 4 }).format(Number(n) || 0);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

type Ledger = {
  buying_transaction_id: string; transaction_date: string; due_date: string | null; party: string;
  units: number; principal: number; rate: number; basis: string; start_date: string; end_date: string | null;
  principal_paid: number; principal_due: number; return_paid: number; people_money_status: string;
  return_accrued: number; return_due: number; total_investor_payable: number;
};
type Bridge = {
  selling_transaction_id: string; transaction_date: string; selling_party: string; selling_units: number;
  selling_revenue: number; people_units_sold: number; people_fifo_cost: number; people_selling_revenue: number;
  people_trading_margin: number; investor_return_accrued_through_sale: number; people_net_profit_after_return: number;
};
type Provider = {
  party_id: string; party: string; buying_transactions: number; units: number; principal: number;
  principal_paid: number; principal_due: number; return_accrued: number; return_paid: number;
  return_due: number; total_investor_payable: number;
};

function Card({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'amber' | 'dark' }) {
  return <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 18, background: tone === 'dark' ? '#101713' : '#fff' }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: tone === 'dark' ? '#aab8b0' : '#69736d' }}>{label}</div>
    <div style={{ marginTop: 8, fontSize: 25, fontWeight: 750, color: tone === 'dark' ? '#fff' : tone === 'green' ? '#166534' : tone === 'amber' ? '#9a6700' : '#101713' }}>৳{value}</div>
  </div>;
}

export default function PeoplesMoneyPage() {
  const supabase = createClient();
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [bridge, setBridge] = useState<Bridge[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const [l, b, p] = await Promise.all([
      supabase.from('v_people_money_ledger').select('*').order('transaction_date', { ascending: false }),
      supabase.from('v_people_money_profit_bridge').select('*').order('transaction_date', { ascending: false }),
      supabase.from('v_people_money_provider_summary').select('*').order('total_investor_payable', { ascending: false }),
    ]);
    if (l.error || b.error || p.error) setError(l.error?.message || b.error?.message || p.error?.message || 'Unable to load People’s Money data.');
    setLedger((l.data || []).map((x: any) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, ['units','principal','rate','principal_paid','principal_due','return_paid','return_accrued','return_due','total_investor_payable'].includes(k) ? Number(v) : v])) as Ledger));
    setBridge((b.data || []).map((x: any) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, ['selling_units','selling_revenue','people_units_sold','people_fifo_cost','people_selling_revenue','people_trading_margin','investor_return_accrued_through_sale','people_net_profit_after_return'].includes(k) ? Number(v) : v])) as Bridge));
    setProviders((p.data || []).map((x: any) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, ['buying_transactions','units','principal','principal_paid','principal_due','return_accrued','return_paid','return_due','total_investor_payable'].includes(k) ? Number(v) : v])) as Provider));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('people-money-profit-bridge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buying_lots' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totals = useMemo(() => ({
    principal: ledger.reduce((a, x) => a + x.principal, 0),
    principalDue: ledger.reduce((a, x) => a + x.principal_due, 0),
    returnAccrued: ledger.reduce((a, x) => a + x.return_accrued, 0),
    returnPaid: ledger.reduce((a, x) => a + x.return_paid, 0),
    returnDue: ledger.reduce((a, x) => a + x.return_due, 0),
    totalPayable: ledger.reduce((a, x) => a + x.total_investor_payable, 0),
    peopleRevenue: bridge.reduce((a, x) => a + x.people_selling_revenue, 0),
    peopleCost: bridge.reduce((a, x) => a + x.people_fifo_cost, 0),
    tradingMargin: bridge.reduce((a, x) => a + x.people_trading_margin, 0),
    netProfit: bridge.reduce((a, x) => a + x.people_net_profit_after_return, 0),
  }), [ledger, bridge]);

  const exportCsv = () => {
    const rows = [
      ['Investor', 'Buying Transactions', 'Units', 'Principal', 'Principal Paid', 'Principal Due', 'Return Accrued', 'Return Paid', 'Return Due', 'Total Payable'],
      ...providers.map(x => [x.party, x.buying_transactions, x.units, x.principal, x.principal_paid, x.principal_due, x.return_accrued, x.return_paid, x.return_due, x.total_investor_payable]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); a.download = `A-P-Traders-Peoples-Money-${today()}.csv`; a.click();
  };

  if (loading) return <main style={{ padding: 32, fontFamily: 'Inter,system-ui,sans-serif' }}>Loading People’s Money ledger…</main>;

  return <main style={{ minHeight: '100vh', background: '#f6f7f3', color: '#101713', padding: '30px 34px', fontFamily: 'Inter,system-ui,sans-serif' }}>
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 24 }}>
        <div><div style={{ fontSize: 11, letterSpacing: '.12em', fontWeight: 700, color: '#166534' }}>A P TRADERS · SECONDARY BUSINESS</div><h1 style={{ margin: '6px 0', fontSize: 34 }}>People’s Money</h1><p style={{ margin: 0, color: '#68726c' }}>Investor principal, investor return, trading margin and your actual profit are kept separate.</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Link href="/secondary" style={{ border: '1px solid #d7ddd8', padding: '9px 12px', borderRadius: 10, textDecoration: 'none', color: '#101713', background: '#fff', fontSize: 12 }}>← Main Business</Link><button onClick={exportCsv} style={{ border: '1px solid #d7ddd8', padding: '9px 12px', borderRadius: 10, background: '#fff', color: '#101713', cursor: 'pointer' }}>⇩ Provider CSV</button><div style={{ fontSize: 12, color: '#68726c' }}>Live · {today()} · Asia/Dhaka</div></div>
      </div>
      {error && <div style={{ marginBottom: 18, padding: 12, borderRadius: 10, background: '#fff1f2', color: '#b42318' }}>{error}</div>}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
        <Card label="Principal Outstanding" value={money(totals.principalDue)} tone="dark" />
        <Card label="Investor Return Payable" value={money(totals.returnDue)} tone="amber" />
        <Card label="Total Investor Payable" value={money(totals.totalPayable)} />
        <Card label="Your People’s Money Net Profit" value={money(totals.netProfit)} tone="green" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
        <Card label="People Selling Revenue" value={money(totals.peopleRevenue)} />
        <Card label="People FIFO Cost" value={money(totals.peopleCost)} />
        <Card label="Trading Margin" value={money(totals.tradingMargin)} tone="green" />
        <Card label="Return Accrued / Paid" value={`${money(totals.returnAccrued)} / ${money(totals.returnPaid)}`} />
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'auto', marginBottom: 22 }}>
        <div style={{ padding: 18, borderBottom: '1px solid #edf0ed' }}><h2 style={{ margin: 0, fontSize: 18 }}>Investor / Provider Summary</h2><p style={{ margin: '5px 0 0', color: '#68726c', fontSize: 12 }}>One row per People’s Money provider. Principal and return remain separate from business profit.</p></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr>{['Investor','Buying Txns','Units','Principal','Principal Paid','Principal Due','Return Accrued','Return Paid','Return Due','Total Payable'].map(h=><th key={h} style={{ textAlign: 'left', padding: 12, background: '#f7f8f5', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead><tbody>{providers.map(x=><tr key={x.party_id}>{[x.party,x.buying_transactions,units(x.units),`৳${money(x.principal)}`,`৳${money(x.principal_paid)}`,`৳${money(x.principal_due)}`,`৳${money(x.return_accrued)}`,`৳${money(x.return_paid)}`,`৳${money(x.return_due)}`,`৳${money(x.total_investor_payable)}`].map((v,i)=><td key={i} style={{ padding: 12, borderTop: '1px solid #edf0ed', whiteSpace: 'nowrap', fontWeight: i===9 ? 700 : 400 }}>{v}</td>)}</tr>)}</tbody></table>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'auto', marginBottom: 22 }}>
        <div style={{ padding: 18, borderBottom: '1px solid #edf0ed' }}><h2 style={{ margin: 0, fontSize: 18 }}>Investor Ledger</h2><p style={{ margin: '5px 0 0', color: '#68726c', fontSize: 12 }}>Buying amount is principal. Buying rate creates the investor return. They are never mixed.</p></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr>{['Investor','Buying Date','Units','Principal','Rate','Basis','Return Accrued','Return Paid','Return Payable','Principal Due','Total Payable'].map(h=><th key={h} style={{ textAlign: 'left', padding: 12, background: '#f7f8f5', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead><tbody>{ledger.map(x=><tr key={x.buying_transaction_id}>{[x.party,x.transaction_date,units(x.units),`৳${money(x.principal)}`,x.rate,x.basis,`৳${money(x.return_accrued)}`,`৳${money(x.return_paid)}`,`৳${money(x.return_due)}`,`৳${money(x.principal_due)}`,`৳${money(x.total_investor_payable)}`].map((v,i)=><td key={i} style={{ padding: 12, borderTop: '1px solid #edf0ed', whiteSpace: 'nowrap' }}>{v}</td>)}</tr>)}</tbody></table>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'auto' }}>
        <div style={{ padding: 18, borderBottom: '1px solid #edf0ed' }}><h2 style={{ margin: 0, fontSize: 18 }}>People’s Money Profit Bridge</h2><p style={{ margin: '5px 0 0', color: '#68726c', fontSize: 12 }}>Each sale uses FIFO to identify investor-funded units and calculates the margin created by reselling them.</p></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr>{['Sale Date','Selling Party','People Units','People Revenue','FIFO Cost','Trading Margin','Investor Return Through Sale','Your Net Profit'].map(h=><th key={h} style={{ textAlign: 'left', padding: 12, background: '#f7f8f5', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead><tbody>{bridge.map(x=><tr key={x.selling_transaction_id}>{[x.transaction_date,x.selling_party,units(x.people_units_sold),`৳${money(x.people_selling_revenue)}`,`৳${money(x.people_fifo_cost)}`,`৳${money(x.people_trading_margin)}`,`৳${money(x.investor_return_accrued_through_sale)}`,`৳${money(x.people_net_profit_after_return)}`].map((v,i)=><td key={i} style={{ padding: 12, borderTop: '1px solid #edf0ed', whiteSpace: 'nowrap', fontWeight: i===7 ? 700 : 400 }}>{v}</td>)}</tr>)}</tbody></table>
      </section>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: '#eaf4ec', color: '#24532f', fontSize: 12 }}><strong>Calculation:</strong> People’s Trading Margin = People-funded Selling Revenue − People FIFO Cost. Your People’s Money Net Profit = Trading Margin − Investor Return. Investor Principal Outstanding is tracked separately and is never treated as profit.</div>
    </div>
  </main>;
}
