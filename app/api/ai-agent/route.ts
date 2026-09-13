import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Master AI',
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
}

export async function POST(req: Request) {
  try {
    const { question, history = [] } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Master AI is not configured in Production. OPENAI_API_KEY is missing.' }, { status: 503 });

    const supabase = await createClient();
    const [{ data: transactions, error }, { data: lots }, { data: allocations }] = await Promise.all([
      supabase.from('transactions').select('id,type,party_id,transaction_date,units,amount,rate,realized_profit,owner_funded,people_funded,paid,return_paid,due_date,start_date,end_date,note').eq('business_code','secondary').order('transaction_date',{ascending:false}).limit(500),
      supabase.from('buying_lots').select('id,transaction_id,units,unit_cost,owner_units,people_units,remaining_units,lot_date').eq('business_code','secondary').order('lot_date'),
      supabase.from('fifo_allocations').select('selling_transaction_id,buying_lot_id,units,cost_amount,owner_units,people_units').eq('business_code','secondary'),
    ]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = transactions || [];
    const buying = rows.filter((x:any) => x.type === 'Buying');
    const selling = rows.filter((x:any) => x.type === 'Selling');
    const peopleReceived = buying.reduce((s:any,x:any)=>s+Number(x.amount||0),0);
    const peopleUsed = selling.reduce((s:any,x:any)=>s+Number(x.people_funded||0),0);
    const peopleRemaining = Math.max(0, peopleReceived - peopleUsed);
    const boughtUnits = buying.reduce((s:any,x:any)=>s+Number(x.units||0),0);
    const soldUnits = selling.reduce((s:any,x:any)=>s+Number(x.units||0),0);
    const peopleProfit = (allocations||[]).reduce((s:any,a:any)=>{
      const sale = rows.find((x:any)=>x.id === a.selling_transaction_id);
      const lot = (lots||[]).find((x:any)=>x.id === a.buying_lot_id);
      const source = lot ? buying.find((x:any)=>x.id === lot.transaction_id) : null;
      return sale && source ? s + Number(a.people_units||0) * 150 * (Number(sale.rate||0)-Number(source.rate||0)) : s;
    },0);
    const ownerIncome = (allocations||[]).reduce((s:any,a:any)=>{
      const sale = rows.find((x:any)=>x.id === a.selling_transaction_id);
      return sale ? s + Number(a.owner_units||0) * 150 * Number(sale.rate||0) : s;
    },0);
    const snapshot = { unit_value:165000, people_money_received:peopleReceived, people_money_used:peopleUsed, people_money_remaining:peopleRemaining, bought_units:boughtUnits, sold_units:soldUnits, available_units:Math.max(0,boughtUnits-soldUnits), people_profit:peopleProfit, owner_earning:ownerIncome };

    const messages = [
      { role: 'system', content: `You are Master, the financial control AI for A P Traders. Use only the supplied Secondary Business ledger and calculated snapshot. Never invent figures. Currency: ৳. 1 Unit = ৳165,000. Buying = People's Money principal. Selling consumes People's Money first by oldest FIFO, then Owner Capital. Principal is never profit. People profit is the monthly rate spread on sold People-funded units: people units × 150 × (selling rate − source buying rate). Owner earning is owner-funded sold units × 150 × selling rate. Distinguish received/remaining principal, payable obligation, realized FIFO principal profit, People margin, and Owner earning. If the ledger cannot answer something, say so. Understand Bangla, Banglish and English and answer in the user's language/style. SNAPSHOT: ${JSON.stringify(snapshot)} LEDGER: ${JSON.stringify(rows)} LOTS: ${JSON.stringify(lots||[])} ALLOCATIONS: ${JSON.stringify(allocations||[])}` },
      ...history.slice(-8).map((m: {role:string;text:string}) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: String(m.text || '') })),
      { role: 'user', content: question.trim() },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`}, body:JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, temperature:0.1, max_tokens:700 }) });
    const body = await response.json().catch(()=>({}));
    if (!response.ok) return NextResponse.json({ error: body?.error?.message || `OpenAI request failed (${response.status}).` }, { status: 502 });
    return NextResponse.json({ answer: body.choices?.[0]?.message?.content || 'I could not generate an answer.' });
  } catch (e) {
    console.error('Master AI error', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected Master AI error.' }, { status: 500 });
  }
}
