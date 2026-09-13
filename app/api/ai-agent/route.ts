import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { question, history = [] } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Master AI is not configured in Production. OPENAI_API_KEY is missing.' }, { status: 503 });

    const supabase = await createClient();
    const { data: transactions, error } = await supabase.from('transactions')
      .select('type,transaction_date,units,amount,realized_profit,owner_funded,people_funded,paid,return_paid,note')
      .eq('business_code','secondary').order('transaction_date',{ascending:false}).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const messages = [
      { role: 'system', content: `You are Master, the financial control AI for A P Traders.
Use only the supplied Secondary Business ledger. Never invent figures. Currency: ৳.
Rules: 1 Unit = ৳165,000. Buying = People's Money principal; Buying Units = Amount ÷ 165,000. Selling consumes People's Money inventory first, oldest FIFO, then Owner Capital oldest FIFO. Selling people_funded and owner_funded are FIFO costs; realized_profit = selling amount − FIFO cost. Owner Capital is released as owner-funded inventory sells. Principal is not profit.
Understand Bangla, Banglish and English. Reply in the user's language/style. Calculate figures from the ledger when possible and say when data is unavailable.
LEDGER: ${JSON.stringify(transactions || [])}` },
      ...history.slice(-8).map((m: {role:string;text:string}) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: String(m.text || '') })),
      { role: 'user', content: question.trim() },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, temperature:0.1, max_tokens:600 })
    });
    const body = await response.json().catch(()=>({}));
    if (!response.ok) return NextResponse.json({ error: body?.error?.message || `OpenAI request failed (${response.status}).` }, { status: 502 });
    return NextResponse.json({ answer: body.choices?.[0]?.message?.content || 'I could not generate an answer.' });
  } catch (e) {
    console.error('Master AI error', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected Master AI error.' }, { status: 500 });
  }
}
