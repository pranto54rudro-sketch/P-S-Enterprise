'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, BrainCircuit, CheckCircle2, CircleDollarSign, Send, Sparkles, TrendingUp, WalletCards } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(Number(n) || 0);

type Tx = { type: string; amount: number; units: number; realized_profit: number; owner_funded: number; people_funded: number; paid: number; return_paid: number };

type Message = { role: 'agent' | 'user'; text: string };

export default function AIAgentPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'agent', text: 'I am your financial control assistant. Ask about capital, buying, selling, units, People’s Money, profit, or outstanding amounts.' }]);

  useEffect(() => {
    supabase.from('transactions').select('type,amount,units,realized_profit,owner_funded,people_funded,paid,return_paid').eq('business_code', 'secondary').then(({ data }) => setTransactions((data || []) as Tx[]));
  }, []);

  const stats = useMemo(() => {
    const buying = transactions.filter(t => t.type === 'Buying');
    const selling = transactions.filter(t => t.type === 'Selling');
    return {
      buying: buying.reduce((s, t) => s + Number(t.amount || 0), 0),
      selling: selling.reduce((s, t) => s + Number(t.amount || 0), 0),
      profit: selling.reduce((s, t) => s + Number(t.realized_profit || 0), 0),
      units: buying.reduce((s, t) => s + Number(t.units || 0), 0) - selling.reduce((s, t) => s + Number(t.units || 0), 0),
      people: buying.reduce((s, t) => s + Number(t.people_funded || 0), 0),
    };
  }, [transactions]);

  function answer(question: string) {
    const q = question.toLowerCase();
    if (q.includes('profit')) return `Realized selling profit is ৳${money(stats.profit)} based on the current Secondary Business ledger.`;
    if (q.includes('buy')) return `Total buying recorded is ৳${money(stats.buying)} across ${transactions.filter(t => t.type === 'Buying').length} buying transactions.`;
    if (q.includes('sell') || q.includes('revenue')) return `Total selling revenue recorded is ৳${money(stats.selling)} across ${transactions.filter(t => t.type === 'Selling').length} selling transactions.`;
    if (q.includes('unit')) return `Estimated remaining units are ${money(stats.units)}. The system uses 1 Unit = ৳165,000 and FIFO for selling allocation.`;
    if (q.includes('people') || q.includes('invest')) return `People’s Money linked to buying is ৳${money(stats.people)}.`;
    if (q.includes('capital') || q.includes('owner')) return `Owner-funded buying recorded in the current Secondary Business ledger is ৳${money(transactions.filter(t => t.type === 'Buying').reduce((s, t) => s + Number(t.owner_funded || 0), 0))}.`;
    return `I can analyze the live Secondary Business ledger. Try “What is our profit?”, “How much did we buy?”, “How much did we sell?”, “How many units remain?”, or “How much People’s Money is involved?”`;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages(m => [...m, { role: 'user', text: q }, { role: 'agent', text: answer(q) }]);
    setInput('');
  }

  return (
    <main className="agent-page">
      <div className="agent-shell">
        <header className="agent-header">
          <Link href="/dashboard" className="back-link"><ArrowLeft size={17} /> Dashboard</Link>
          <div className="agent-status"><span /> Live financial context</div>
        </header>

        <section className="agent-hero">
          <div className="agent-title-row">
            <div className="agent-orb"><Bot size={30} /></div>
            <div><div className="agent-kicker"><Sparkles size={13} /> AI FINANCIAL AGENT</div><h1>Ask your business.</h1><p>Turn the live ledger into quick, decision-ready answers.</p></div>
          </div>
          <div className="agent-pills"><span><BrainCircuit size={15} /> Secondary Business</span><span><CheckCircle2 size={15} /> FIFO aware</span><span><CheckCircle2 size={15} /> Live ledger</span></div>
        </section>

        <section className="agent-grid">
          <div className="agent-chat card-surface">
            <div className="chat-top"><div><strong>Financial Assistant</strong><small>Ask in plain language</small></div><div className="online">ONLINE</div></div>
            <div className="messages">
              {messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}><div className="bubble-icon">{m.role === 'agent' ? <Bot size={16} /> : 'You'}</div><div>{m.text}</div></div>)}
            </div>
            <div className="suggestions"><button onClick={() => setInput('What is our profit?')}>Profit summary</button><button onClick={() => setInput('How many units remain?')}>Remaining units</button><button onClick={() => setInput('How much People’s Money is involved?')}>People’s Money</button></div>
            <form onSubmit={submit} className="chat-input"><input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your financials…" /><button aria-label="Send"><Send size={18} /></button></form>
          </div>

          <aside className="agent-side">
            <div className="insight-card"><div className="insight-label"><TrendingUp size={15} /> LIVE SNAPSHOT</div><div className="insight-value">৳{money(stats.profit)}</div><div className="insight-sub">Realized selling profit</div></div>
            <div className="mini-grid">
              <Mini icon={<CircleDollarSign size={17} />} label="Buying" value={`৳${money(stats.buying)}`} />
              <Mini icon={<WalletCards size={17} />} label="Selling" value={`৳${money(stats.selling)}`} />
              <Mini icon={<Sparkles size={17} />} label="Units" value={money(stats.units)} />
              <Mini icon={<Bot size={17} />} label="People’s Money" value={`৳${money(stats.people)}`} />
            </div>
            <div className="agent-note"><strong>What this agent can do</strong><p>Summarize ledger activity, explain key numbers, and surface quick operational insights without mixing Main and Secondary Business data.</p></div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="mini-card"><div className="mini-icon">{icon}</div><small>{label}</small><strong>{value}</strong></div>;
}
