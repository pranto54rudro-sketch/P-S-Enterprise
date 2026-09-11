'use client';

import Link from 'next/link';

export default function ProPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#07100e', color: '#edf7f2' }}>
      <div style={{ maxWidth: 760, background: '#0c1815', border: '1px solid #1c332b', borderRadius: 24, padding: 32, textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a7d8ff', margin: '0 0 16px', fontSize: 12 }}>Pro features</p>
        <h1 style={{ margin: '0 0 18px', fontSize: 'clamp(2.3rem, 5vw, 4rem)' }}>Unlock the premium dashboard</h1>
        <p style={{ color: '#b9c7c0', marginBottom: 26 }}>
          Full transaction controls, advanced reporting, financial dashboards, and admin monitoring require a logged-in account.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: '#b7ef57', color: '#102008', textDecoration: 'none', padding: '14px 22px', borderRadius: 12, fontWeight: 800 }}>Register</Link>
          <Link href="/login" style={{ background: '#10211c', border: '1px solid #1c332b', color: '#edf7f2', textDecoration: 'none', padding: '14px 22px', borderRadius: 12, fontWeight: 800 }}>Login</Link>
        </div>
      </div>
    </main>
  );
}
