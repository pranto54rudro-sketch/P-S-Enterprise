'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const money = (n: number) => new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(n || 0);

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const userEmail = data.user?.email || '';

      if (!userEmail) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase.from('profiles').select('*').limit(20);
      const { data: txs } = await supabase.from('transactions').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const { data: settings } = await supabase.from('business_settings').select('*').limit(1);

      setUserList(
        (profiles || []).map((profile) => ({
          id: profile.id,
          email: profile.full_name || 'Unknown profile',
          role: profile.role || 'owner',
          transactions: (txs || []).filter((tx) => tx.created_by === profile.id).length,
          payments: (payments || []).filter((p) => p.created_by === profile.id).length,
          opening: settings?.[0]?.opening_capital || 0,
        }))
      );
      setLoading(false);
    };

    load();
    return () => listener.subscription.unsubscribe();
  }, []);

  const totals = useMemo(() => {
    const totalUsers = userList.length;
    const totalTransactions = userList.reduce((sum, user) => sum + user.transactions, 0);
    const totalPayments = userList.reduce((sum, user) => sum + user.payments, 0);
    return { totalUsers, totalTransactions, totalPayments };
  }, [userList]);

  if (loading) {
    return <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2', display: 'grid', placeItems: 'center' }}>Loading admin panel…</main>;
  }

  if (!session) {
    return (
      <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 620, textAlign: 'center', background: '#0c1815', border: '1px solid #1c332b', borderRadius: 24, padding: 32 }}>
          <h1 style={{ marginTop: 0 }}>Admin access required</h1>
          <p style={{ color: '#b9c7c0', marginBottom: 22 }}>Please sign in to access user monitoring and analytics.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" style={{ background: '#b7ef57', color: '#102008', textDecoration: 'none', padding: '12px 18px', borderRadius: 12, fontWeight: 800 }}>Login</Link>
            <Link href="/" style={{ background: '#10211c', border: '1px solid #1c332b', color: '#edf7f2', textDecoration: 'none', padding: '12px 18px', borderRadius: 12, fontWeight: 800 }}>Home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 28 }}>Admin monitoring</div>
            <div style={{ color: '#8ea69c', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Platform analytics & user oversight</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#edf7f2', textDecoration: 'none' }}>Home</Link>
            <Link href="/dashboard" style={{ color: '#edf7f2', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18, marginBottom: 26 }}>
          <Card label="Registered users" value={String(totals.totalUsers)} />
          <Card label="Total transactions" value={String(totals.totalTransactions)} />
          <Card label="Recorded payments" value={String(totals.totalPayments)} />
          <Card label="Platform revenue" value={`৳ ${money(1200000)}`} />
        </section>

        <section style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 22, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>User activity</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Transactions</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Payments</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Opening capital</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, index) => (
                  <tr key={user.id || index} style={{ borderTop: '1px solid #1c332b' }}>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.role}</td>
                    <td style={{ padding: '12px' }}>{user.transactions}</td>
                    <td style={{ padding: '12px' }}>{user.payments}</td>
                    <td style={{ padding: '12px' }}>৳ {money(user.opening)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 18, padding: 20 }}>
      <div style={{ color: '#8ea69c', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>{value}</div>
    </div>
  );
}
