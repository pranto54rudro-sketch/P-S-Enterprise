'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const money=(n:number)=>new Intl.NumberFormat('en-BD',{maximumFractionDigits:2}).format(Number(n)||0);
export default function MainBusiness(){
 const s=createClient(); const [rows,setRows]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 useEffect(()=>{s.from('transactions').select('id,type,transaction_date,units,amount,rate').eq('business_code','main').order('transaction_date',{ascending:false}).then(({data,error})=>{setRows(data||[]);if(error)setError(error.message);setLoading(false)})},[]);
 const revenue=rows.filter(x=>x.type==='Selling').reduce((a,x)=>a+Number(x.amount||0),0); const buying=rows.filter(x=>x.type==='Buying').reduce((a,x)=>a+Number(x.amount||0),0);
 return <main style={{minHeight:'100vh',background:'#f6f7f3',padding:30,fontFamily:'Inter,system-ui,sans-serif',color:'#101713'}}><div style={{maxWidth:1100,margin:'auto'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><div><div style={{fontSize:11,fontWeight:800,letterSpacing:'.12em',color:'#166534'}}>A P TRADERS</div><h1 style={{margin:'6px 0'}}>Main Business</h1><p style={{margin:0,color:'#68726c'}}>Primary business ledger. Add your main-business data here when ready.</p></div><Link href="/dashboard" style={{padding:'10px 14px',border:'1px solid #d7ddd8',borderRadius:9,background:'#fff',color:'#101713',textDecoration:'none'}}>← Financial Dashboard</Link></header>
  <section style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:18}}>{[['Transactions',rows.length],['Buying',`৳${money(buying)}`],['Selling Revenue',`৳${money(revenue)}`]].map(([l,v])=><div key={String(l)} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:20}}><div style={{fontSize:11,textTransform:'uppercase',color:'#68726c'}}>{l}</div><div style={{fontSize:28,fontWeight:800,marginTop:7}}>{v}</div></div>)}</section>
  <section style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:22}}><h2 style={{marginTop:0}}>Main Business Ledger</h2>{loading?<p>Loading…</p>:error?<p style={{color:'#b91c1c'}}>{error}</p>:rows.length===0?<div style={{padding:'42px 20px',textAlign:'center',border:'1px dashed #cfd6d1',borderRadius:12}}><h3>No main-business data yet</h3><p style={{color:'#68726c'}}>This is intentional. The Main Business interface is ready for you to fill in later.</p></div>:<table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Date','Type','Units','Amount','Rate'].map(h=><th key={h} style={{padding:12,textAlign:'left',background:'#f7f8f5'}}>{h}</th>)}</tr></thead><tbody>{rows.map(x=><tr key={x.id}>{[x.transaction_date,x.type,x.units,`৳${money(x.amount)}`,x.rate].map((v,i)=><td key={i} style={{padding:11,borderTop:'1px solid #edf0ed'}}>{v}</td>)}</tr>)}</tbody></table>}</section>
 </div></main>;
}
