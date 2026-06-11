'use client';

import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const services = [
  { href: '/payments/electricity', icon: '⚡', title: 'Energy Management', desc: 'Prepaid meter top-ups via DisCos', color: 'rgba(245, 158, 11, 0.15)' },
  { href: '/payments/transfer', icon: '💰', title: 'Universal Transfers', desc: 'Bank-to-bank & bulk subsidies', color: 'rgba(0, 166, 81, 0.15)' },
  { href: '/payments/airtime', icon: '📱', title: 'Airtime Core', desc: 'Telco automated routing', color: 'rgba(59, 130, 246, 0.15)' },
  { href: '/payments/data', icon: '📶', title: 'Data Core', desc: 'Data bundles for all networks', color: 'rgba(139, 92, 246, 0.15)' },
];

export default function PaymentsPage() {
  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <h2>Core Infrastructure</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Powered by Interswitch</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {services.map((s) => (
            <Link key={s.href} href={s.href} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--radius-md)',
                background: s.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{s.title}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{s.desc}</p>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
