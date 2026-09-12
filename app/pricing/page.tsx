'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '৳ 0',
    description: 'Public overview only',
    features: ['Public business summary', 'Basic KPI cards', 'Read-only dashboard'],
    cta: 'Start free',
    href: '/register',
    active: false,
  },
  {
    name: 'Pro',
    price: '৳ 4,500/mo',
    description: 'Full business control',
    features: ['All finance dashboards', 'Access to transactions and capital tools', 'Reports and payment control', 'Admin analytics access'],
    cta: 'Upgrade now',
    href: '/register',
    active: true,
  },
];

export default function PricingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07100e', color: '#edf7f2', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 28 }}>A P Traders</div>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#edf7f2', textDecoration: 'none' }}>Home</Link>
            <Link href="/public" style={{ color: '#edf7f2', textDecoration: 'none' }}>Public</Link>
            <Link href="/login" style={{ color: '#edf7f2', textDecoration: 'none' }}>Login</Link>
          </nav>
        </header>

        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a7d8ff', fontSize: 12 }}>Simple pricing</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', margin: '0 0 12px' }}>Choose the plan that matches your workflow.</h1>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <article key={plan.name} style={{ background: plan.active ? '#0c1815' : '#0b1512', border: plan.active ? '1px solid #b7ef57' : '1px solid #1c332b', borderRadius: 22, padding: 24, boxShadow: plan.active ? '0 18px 50px rgba(183,239,87,0.1)' : 'none' }}>
              <div style={{ color: '#8ea69c', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 12 }}>{plan.name}</div>
              <div style={{ fontSize: 42, fontWeight: 800, margin: '16px 0 8px' }}>{plan.price}</div>
              <div style={{ color: '#b9c7c0', marginBottom: 18 }}>{plan.description}</div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'grid', gap: 10 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ color: '#edf7f2' }}>✓ {feature}</li>
                ))}
              </ul>

              <Link href={plan.href} style={{ display: 'inline-block', background: plan.active ? '#b7ef57' : '#10211c', color: plan.active ? '#102008' : '#edf7f2', textDecoration: 'none', padding: '12px 18px', borderRadius: 12, fontWeight: 800 }}>{plan.cta}</Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
