import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { question, history = [] } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI Agent is not configured yet. Add OPENAI_API_KEY to the Vercel environment variables.' }, { status: 503 });

    const supabase = await createClient();
    const { data: transactions, error } = await supabase.from('transactions').select('type,transaction_date,units,amount,realized_profit,owner_funded,people_funded,paid,return_paid,note').eq('business_code','secondary').order('transaction_date',{ascending:false}).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const context = JSON.stringify(transactions || []);
    const messages = [
      { role: 'system', content: `You are Master, the financial control AI for A P Traders.

DATA SCOPE
- Use ONLY the supplied Secondary Business ledger context. Never invent figures.
- Main Business is completely separate and must never be mixed into these calculations.
- Currency is Bangladeshi Taka (৳).

BUSINESS CALCULATION RULES
- 1 Unit = ৳165,000.
- Buying means People's Money is brought into the business. For a Buying entry, the entered amount is the People's Money principal and Units = Amount ÷ 165,000.
- Selling means inventory is sold continuously. Selling consumes People's Money-funded inventory FIRST, using oldest People's Money lot first. Only after People's Money inventory is exhausted does it consume Owner Capital-funded inventory, again oldest first.
- A Selling transaction's people_funded and owner_funded fields represent the FIFO cost allocated from those two funding sources; realized_profit = selling amount − total FIFO cost.
- Owner Capital is released as Owner-funded inventory is sold.
- Do not confuse People's Money principal with profit/return. A People's Money return is separate from principal.

LANGUAGE
- Understand Bangla (বাংলা), Banglish, and English naturally, including mixed-language questions.
- Reply in the same language/style as the user. If the user writes Bangla or Banglish, answer in Bangla unless they explicitly request English. If they write English, answer in English.
- Keep financial figures exact and explain the calculation briefly when useful.

ANSWERING
- If the requested figure can be calculated from the ledger, calculate it yourself instead of saying you cannot.
- If a figure is not available from the supplied ledger, clearly say that it is not available; never guess.
- Be concise, practical, and decision-oriented.

LEDGER CONTEXT: ${context}` },
      ...history.slice(-8).map((m: {role:string;text:string}) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: String(m.text || '') })),
      { role: 'user', content: question.trim() },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, temperature:0.1, max_tokens:600 }) });
    const body = await response.json();
    if (!response.ok) return NextResponse.json({ error: body?.error?.message || 'AI provider request failed.' }, { status: 502 });
    return NextResponse.json({ answer: body.choices?.[0]?.message?.content || 'I could not generate an answer.' });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected AI Agent error.' }, { status: 500 }); }
}
