'use client';

import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const services = [
  { href: '/payback', icon: '🛡️', title: 'PayBack Dispute Defense', desc: 'PayPal Disputes API v1 automated proof dispatch', color: 'rgba(0, 112, 186, 0.2)' },
  { href: '/payback', icon: '🔄', title: 'Pay Later Churn Bailout', desc: 'Dynamic PayPal Pay in 4 installment generator', color: 'rgba(16, 185, 129, 0.2)' },
  { href: '/payback', icon: '⚡', title: 'PayPal Webhook Telemetry', desc: 'Customer dispute & billing event listener', color: 'rgba(56, 189, 248, 0.2)' },
  { href: '/history', icon: '💳', title: 'PayPal Merchant Payouts', desc: 'Enterprise double-entry settlement history', color: 'rgba(245, 158, 11, 0.2)' },
];

export default function PaymentsPage() {
  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <h2>PayPal Merchant Services</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>PayPal Developer APIs • Sandbox v1 Active</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {services.map((s) => (
            <Link key={s.title} href={s.href} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--radius-md)',
                background: s.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#F8FAFC' }}>{s.title}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{s.desc}</p>
              </div>
              <span style={{ color: '#38BDF8' }}>→</span>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
