'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    window.location.assign('/dashboard');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#07100e', color: '#edf7f2' }}>
      <div style={{ width: '100%', maxWidth: 460, padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(10,20,16,.9)', boxShadow: '0 24px 80px rgba(0,0,0,.3)' }}>
        <div style={{ marginBottom: 24 }}>
          <strong style={{ fontSize: 22 }}>A P Traders</strong>
          <p style={{ opacity: .7, marginTop: 8, marginBottom: 0 }}>Owner access · Financial Control System</p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1c332b', background: '#06130f' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1c332b', background: '#06130f' }}
            />
          </label>

          {message && <p style={{ marginBottom: 16, color: '#ff7373' }}>{message}</p>}

          <button type="submit" disabled={busy} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#b7ef57', color: '#102008', fontWeight: 700 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16, fontSize: 14 }}>
          <Link href="/" style={{ color: '#a7d8ff' }}>Back to public site</Link>
          <Link href="/register" style={{ color: '#a7d8ff' }}>Create account</Link>
        </div>
      </div>
    </main>
  );
}
