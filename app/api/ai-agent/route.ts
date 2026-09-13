import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  return NextResponse.json({ ok:true, service:'Master AI', configured:Boolean(process.env.OPENAI_API_KEY), model:process.env.OPENAI_MODEL||'gpt-4o-mini' });
}

export async function POST(req: Request) {
  try {
    const {question,history=[]}=await req.json();
    if(!question?.trim()) return NextResponse.json({error:'Question is required.'},{status:400});
    const key=process.env.OPENAI_API_KEY;
    if(!key) return NextResponse.json({error:'Master AI is not configured in Production. OPENAI_API_KEY is missing.'},{status:503});
    const supabase=await createClient();
    const [{data:transactions,error},{data:lots},{data:allocations}]=await Promise.all([
      supabase.from('transactions').select('id,type,party_id,transaction_date,units,amount,rate,realized_profit,owner_funded,people_funded,paid,return_paid,due_date,start_date,end_date,note,principal_returned,investor_principal_paid,profit_received,payable_profit_paid,status,status_updated_at').eq('business_code','secondary').order('transaction_date',{ascending:false}).limit(500),
      supabase.from('buying_lots').select('id,transaction_id,units,unit_cost,owner_units,people_units,remaining_units,lot_date').eq('business_code','secondary').order('lot_date'),
      supabase.from('fifo_allocations').select('selling_transaction_id,buying_lot_id,units,cost_amount,owner_units,people_units').eq('business_code','secondary')
    ]);
    if(error) return NextResponse.json({error:error.message},{status:500});
    const rows=transactions||[], buying=rows.filter((x:any)=>x.type==='Buying'), selling=rows.filter((x:any)=>x.type==='Selling'), d=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});
    const peopleReceived=buying.reduce((s:any,x:any)=>s+Number(x.amount||0),0);
    const peopleUsed=selling.reduce((s:any,x:any)=>s+Number(x.people_funded||0),0);
    const peopleRemaining=Math.max(0,peopleReceived-peopleUsed);
    const boughtUnits=buying.reduce((s:any,x:any)=>s+Number(x.units||0),0), soldUnits=selling.reduce((s:any,x:any)=>s+Number(x.units||0),0);
    const peopleProfit=(allocations||[]).reduce((s:any,a:any)=>{const sale=rows.find((x:any)=>x.id===a.selling_transaction_id),lot=(lots||[]).find((x:any)=>x.id===a.buying_lot_id),source=lot?buying.find((x:any)=>x.id===lot.transaction_id):null;return sale&&source?s+Number(a.people_units||0)*150*(Number(sale.rate||0)-Number(source.rate||0)):s},0);
    const ownerIncome=(allocations||[]).reduce((s:any,a:any)=>{const sale=rows.find((x:any)=>x.id===a.selling_transaction_id);return sale?s+Number(a.owner_units||0)*150*Number(sale.rate||0):s},0);
    const dueBuying=buying.filter((x:any)=>x.due_date&&x.due_date<=d);
    const payableProfitDue=dueBuying.reduce((s:any,x:any)=>s+Number(x.units||0)*150*Number(x.rate||0),0);
    const payableProfitPaid=buying.reduce((s:any,x:any)=>s+Number(x.payable_profit_paid||0),0);
    const peoplePrincipalPaidBack=buying.reduce((s:any,x:any)=>s+Number(x.investor_principal_paid||0),0);
    const moneyBackFromSelling=selling.reduce((s:any,x:any)=>s+Number(x.principal_returned||0),0);
    const profitReceived=rows.reduce((s:any,x:any)=>s+Number(x.profit_received||0),0);
    const snapshot={unit_value:165000,base:150,people_money_received:peopleReceived,people_money_used:peopleUsed,people_money_remaining:peopleRemaining,bought_units:boughtUnits,sold_units:soldUnits,available_units:Math.max(0,boughtUnits-soldUnits),people_margin_profit:peopleProfit,owner_earning:ownerIncome,payable_profit_due:payableProfitDue,payable_profit_paid:payableProfitPaid,payable_profit_remaining:Math.max(0,payableProfitDue-payableProfitPaid),people_principal_paid_back:peoplePrincipalPaidBack,money_back_from_selling:moneyBackFromSelling,profit_received:profitReceived,status_counts:rows.reduce((o:any,x:any)=>(o[x.status||'Active']=(o[x.status||'Active']||0)+1,o),{})};
    const messages=[{role:'system',content:`You are Master, the financial control AI for A P Traders. Use ONLY the supplied Secondary Business ledger and snapshot; never invent figures. Currency ৳. 1 Unit = ৳165,000. Buying is People's Money principal. Selling consumes People's Money first by oldest FIFO, then Owner Capital. Principal is never profit. Monthly earning is units × 150 × rate. People margin profit on People-funded sales is people units × 150 × (selling rate − source buying rate). Owner earning is owner-funded sold units × 150 × selling rate. IMPORTANT: Payable Profit Due is a CALCULATED investor obligation from due Buying entries: units × 150 × buying rate. Payable Profit Paid is the ACTUAL amount paid. Payable Profit Remaining = due minus paid, never confuse these. Also distinguish People principal received, principal remaining, principal paid back, selling money received, profit received, realized FIFO profit, People margin and Owner earning. Status values are Active, Due Soon, Due, Overdue, Partially Cleared, Cleared, Renewed. For month-end questions, use settlement fields and status. Answer in Bangla/Banglish/English matching the user. SNAPSHOT: ${JSON.stringify(snapshot)} LEDGER: ${JSON.stringify(rows)} LOTS: ${JSON.stringify(lots||[])} ALLOCATIONS: ${JSON.stringify(allocations||[])}`},...history.slice(-8).map((m:any)=>({role:m.role==='agent'?'assistant':'user',content:String(m.text||'')})),{role:'user',content:question.trim()}];
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages,temperature:0.1,max_tokens:900})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok) return NextResponse.json({error:body?.error?.message||`OpenAI request failed (${response.status}).`},{status:502});
    return NextResponse.json({answer:body.choices?.[0]?.message?.content||'I could not generate an answer.',snapshot});
  } catch(e){console.error('Master AI error',e);return NextResponse.json({error:e instanceof Error?e.message:'Unexpected Master AI error.'},{status:500})}
}
