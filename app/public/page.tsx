'use client';

import Link from 'next/link';

const stats = [
  { label: 'Active partners', value: '124' },
  { label: 'Open transactions', value: '368' },
  { label: 'Monthly profit', value: '৳ 4.8M' },
  { label: 'Inventory units', value: '1,845' },
];

const recent = [
  ['Buying', 'Nabil Motors', '৳ 2,750,000', '2026-09-09'],
  ['Selling', 'Arafat Auto', '৳ 4,120,000', '2026-09-08'],
  ['People’s Money', 'Sami Group', '৳ 1,300,000', '2026-09-07'],
  ['Expense', 'Fuel & logistics', '৳ 96,000', '2026-09-06'],
];

export default function PublicPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 28 }}>A P Traders</div>
            <div style={{ color: '#8ea69c', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Public overview</div>
          </div>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#edf7f2', textDecoration: 'none' }}>Home</Link>
            <Link href="/pricing" style={{ color: '#edf7f2', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/login" style={{ background: '#b7ef57', color: '#102008', textDecoration: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700 }}>Login</Link>
          </nav>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 24, marginBottom: 28 }}>
          <div style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 24, padding: 28 }}>
            <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a7d8ff', margin: '0 0 16px', fontSize: 12 }}>Free platform</p>
            <h1 style={{ fontSize: 'clamp(2.3rem, 4vw, 4rem)', lineHeight: 1.05, margin: '0 0 16px' }}>Public update for everyone, full finance tools behind login.</h1>
            <p style={{ color: '#b9c7c0', maxWidth: 600, marginBottom: 22 }}>
              Anyone can review the platform summary and business overview. For advanced management, owner dashboards, capital tools, and reporting, users need to sign in or register for a pro account.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/register" style={{ background: '#b7ef57', color: '#102008', textDecoration: 'none', padding: '14px 20px', borderRadius: 12, fontWeight: 800 }}>Create account</Link>
              <Link href="/pricing" style={{ border: '1px solid #233a33', color: '#edf7f2', textDecoration: 'none', padding: '14px 20px', borderRadius: 12, fontWeight: 800 }}>View plans</Link>
            </div>
          </div>

          <div style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 24, padding: 24 }}>
            <p style={{ margin: '0 0 14px', color: '#8ea69c', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12 }}>Business status</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {stats.map((item) => (
                <div key={item.label} style={{ background: '#10211c', borderRadius: 14, border: '1px solid #1c332b', padding: 16 }}>
                  <div style={{ color: '#8ea69c', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: '#0c1815', border: '1px solid #1c332b', borderRadius: 22, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>Recent movement</h2>
            <Link href="/login" style={{ color: '#a7d8ff', textDecoration: 'none' }}>Unlock full report</Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Party</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#8ea69c' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(([type, party, amount, date], index) => (
                  <tr key={index} style={{ borderTop: '1px solid #1c332b' }}>
                    <td style={{ padding: '12px', color: '#edf7f2' }}>{type}</td>
                    <td style={{ padding: '12px', color: '#edf7f2' }}>{party}</td>
                    <td style={{ padding: '12px', color: '#edf7f2' }}>{amount}</td>
                    <td style={{ padding: '12px', color: '#b9c7c0' }}>{date}</td>
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
