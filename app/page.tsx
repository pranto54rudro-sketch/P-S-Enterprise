'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 24 }}>A P Traders</div>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/public" style={{ color: '#edf7f2', textDecoration: 'none' }}>Free Platform</Link>
          <Link href="/pricing" style={{ color: '#edf7f2', textDecoration: 'none' }}>Pricing</Link>
          {session ? (
            <Link href="/dashboard" style={{ color: '#081a12', textDecoration: 'none', background: '#b7ef57', padding: '10px 14px', borderRadius: 10, fontWeight: 700 }}>Open dashboard</Link>
          ) : (
            <Link href="/login" style={{ color: '#081a12', textDecoration: 'none', background: '#b7ef57', padding: '10px 14px', borderRadius: 10, fontWeight: 700 }}>Login</Link>
          )}
        </nav>
      </header>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 20px', display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 28 }}>
        <div>
          <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a7d8ff', marginBottom: 14, fontSize: 12 }}>Built for modern operations</p>
          <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 5rem)', lineHeight: 1.05, margin: '0 0 18px' }}>Run your business with a free operating platform and unlock pro tools when you need them.</h1>
          <p style={{ color: '#b9c7c0', fontSize: 18, maxWidth: 640 }}>Track vehicles, capital, people’s money, profit, and user activity with a clean platform that works for everyone — from public access to secure premium dashboards.</p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
            {session ? (
              <Link href="/dashboard" style={{ background: '#b7ef57', color: '#102008', padding: '14px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Go to dashboard</Link>
            ) : (
              <>
                <Link href="/register" style={{ background: '#b7ef57', color: '#102008', padding: '14px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Start free</Link>
                <Link href="/public" style={{ border: '1px solid #233a33', color: '#edf7f2', padding: '14px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Explore free platform</Link>
              </>
            )}
            <Link href="/pricing" style={{ border: '1px solid #233a33', color: '#edf7f2', padding: '14px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>View plans</Link>
          </div>
        </div>

        <div style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 22, padding: 24 }}>
          <p style={{ margin: '0 0 10px', color: '#8ea69c', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 12 }}>Platform overview</p>
          <div style={{ display: 'grid', gap: 14 }}>
            <Stat label="Users" value="1,240" />
            <Stat label="Transactions" value="8,420" />
            <Stat label="Net profit" value="৳ 4.8M" />
            <Stat label="Active admin" value="9" />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        <FeatureCard title="Free access" text="Anyone can view the public platform, check business basics, and understand the system without creating an account." />
        <FeatureCard title="Pro dashboard" text="Advanced financing, transaction tracking, profit analysis, and business controls become available after login or registration." />
        <FeatureCard title="Admin monitoring" text="Admins can track platform-wide users, account activity, and analytics from a dedicated control center." />
      </section>

      {!loading && !session && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/login" style={{ background: '#10211c', border: '1px solid #1c332b', color: '#edf7f2', padding: '12px 18px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Login</Link>
            <Link href="/register" style={{ background: '#b7ef57', color: '#102008', padding: '12px 18px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Create free account</Link>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#10211c', borderRadius: 14, padding: '16px 18px', border: '1px solid #1c332b' }}>
      <div style={{ color: '#8ea69c', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 18, padding: 22 }}>
      <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: '#b9c7c0', margin: 0 }}>{text}</p>
    </div>
  );
}
