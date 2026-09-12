'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() || undefined },
      },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setMessage('Account created successfully. Please check your email and then sign in.');
    setBusy(false);
    setTimeout(() => {
      window.location.assign('/login');
    }, 1200);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#07100e', color: '#edf7f2' }}>
      <div style={{ width: '100%', maxWidth: 470, background: '#0c1815', border: '1px solid #1c332b', borderRadius: 24, padding: 30 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 24 }}>Create your account</div>
          <p style={{ color: '#b9c7c0', margin: '8px 0 0' }}>Register to unlock the full pro dashboard and advanced analytics.</p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Full name</span>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1c332b', background: '#06130f', color: '#edf7f2' }} />
          </label>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1c332b', background: '#06130f', color: '#edf7f2' }} />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Password</span>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1c332b', background: '#06130f', color: '#edf7f2' }} />
          </label>

          {message && <p style={{ marginBottom: 16, color: message.includes('successfully') ? '#b7ef57' : '#ff7373' }}>{message}</p>}

          <button type="submit" disabled={busy} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#b7ef57', color: '#102008', fontWeight: 800 }}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 18, fontSize: 14 }}>
          <Link href="/" style={{ color: '#a7d8ff', textDecoration: 'none' }}>Back home</Link>
          <Link href="/login" style={{ color: '#a7d8ff', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </main>
  );
}
