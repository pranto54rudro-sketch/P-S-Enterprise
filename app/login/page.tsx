'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage('');
    const supabase = createClient();
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup') setMessage('Account created. Check your email if confirmation is enabled.');
    else window.location.href = '/';
    setBusy(false);
  }

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}>
    <form onSubmit={submit} style={{width:'100%',maxWidth:420,padding:32,borderRadius:24,border:'1px solid rgba(255,255,255,.1)',background:'rgba(10,20,16,.9)',boxShadow:'0 24px 80px rgba(0,0,0,.3)'}}>
      <div style={{marginBottom:24}}><strong style={{fontSize:22}}>Vehicle Capital Pro</strong><p style={{opacity:.7,marginTop:8}}>Owner access · Financial Control System</p></div>
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',marginTop:8,marginBottom:16}}/></label>
      <label>Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',marginTop:8,marginBottom:20}}/></label>
      {message && <p style={{marginBottom:16,opacity:.85}}>{message}</p>}
      <button type="submit" disabled={busy} style={{width:'100%',padding:'12px 16px',borderRadius:12}}>{busy ? 'Please wait…' : mode==='login' ? 'Sign in' : 'Create owner account'}</button>
      <button type="button" onClick={()=>setMode(mode==='login'?'signup':'login')} style={{width:'100%',marginTop:10,padding:'10px 16px',borderRadius:12,background:'transparent'}}>{mode==='login' ? 'Create first owner account' : 'Back to sign in'}</button>
    </form>
  </main>;
}
