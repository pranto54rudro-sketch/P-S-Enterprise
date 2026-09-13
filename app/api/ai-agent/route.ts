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
      { role: 'system', content: `You are A P Traders Financial AI Agent. Answer using ONLY the supplied Secondary Business ledger context. Never invent financial figures. Main Business is completely separate and must never be discussed as part of these figures. Explain calculations clearly when useful. Currency is Bangladeshi Taka (৳). The system uses 1 Unit = ৳165,000 and FIFO for selling allocation. Be concise and decision-oriented. Ledger context: ${context}` },
      ...history.slice(-8).map((m: {role:string;text:string}) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: question.trim() },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, temperature:0.2, max_tokens:500 }) });
    const body = await response.json();
    if (!response.ok) return NextResponse.json({ error: body?.error?.message || 'AI provider request failed.' }, { status: 502 });
    return NextResponse.json({ answer: body.choices?.[0]?.message?.content || 'I could not generate an answer.' });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected AI Agent error.' }, { status: 500 }); }
}
