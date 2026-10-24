'use client';

import Link from 'next/link';
import PayPalHeader from '@/components/PayPalHeader';
import BottomNav from '@/components/BottomNav';

const services = [
  { href: '/payback', icon: '🛡️', title: 'PayBack Dispute Defense', desc: 'PayPal Disputes API v1 automated proof dispatch', color: 'rgba(0, 112, 186, 0.15)' },
  { href: '/payback', icon: '🔄', title: 'Pay Later Churn Bailout', desc: 'Dynamic PayPal Pay in 4 installment generator', color: 'rgba(0, 168, 89, 0.15)' },
  { href: '/payback', icon: '⚡', title: 'PayPal Webhook Telemetry', desc: 'Customer dispute & billing event listener', color: 'rgba(0, 112, 186, 0.15)' },
  { href: '/history', icon: '💳', title: 'PayPal Merchant Payouts', desc: 'Enterprise double-entry settlement history', color: 'rgba(255, 196, 57, 0.25)' },
];

export default function PaymentsPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh', transition: 'background 0.2s ease' }}>
      <PayPalHeader />
      <div className="container page-enter" style={{ maxWidth: '1000px', padding: '24px 16px 100px 16px' }}>
        <div className="page-header" style={{ padding: '0 0 var(--space-md)' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>PayPal Merchant Services</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>PayPal Developer APIs • Sandbox v1 Active</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {services.map((s) => (
            <Link key={s.title} href={s.href} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
              textDecoration: 'none',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--radius-md)',
                background: s.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{s.desc}</p>
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>→</span>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
