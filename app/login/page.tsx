'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message);
    else window.location.assign('/');
    setBusy(false);
  }

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}>
    <form onSubmit={submit} style={{width:'100%',maxWidth:420,padding:32,borderRadius:24,border:'1px solid rgba(255,255,255,.1)',background:'rgba(10,20,16,.9)',boxShadow:'0 24px 80px rgba(0,0,0,.3)'}}>
      <div style={{marginBottom:24}}><strong style={{fontSize:22}}>A P Traders</strong><p style={{opacity:.7,marginTop:8}}>Owner access · Financial Control System</p></div>
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',marginTop:8,marginBottom:16}}/></label>
      <label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',marginTop:8,marginBottom:20}}/></label>
      {message && <p style={{marginBottom:16,opacity:.85,color:'#ef4444'}}>{message}</p>}
      <button type="submit" disabled={busy} style={{width:'100%',padding:'12px 16px',borderRadius:12}}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;
}
