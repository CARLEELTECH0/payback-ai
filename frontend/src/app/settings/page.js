'use client';

import PayPalHeader from '@/components/PayPalHeader';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
  };

  const menuItems = [
    { icon: '👤', label: 'Profile', desc: 'View and edit your profile' },
    { icon: '🔒', label: 'Security', desc: 'Password and 2FA settings' },
    { icon: '🔔', label: 'Notifications', desc: 'Manage notification preferences' },
    { icon: '💳', label: 'Payment Methods', desc: 'Add or manage cards' },
    { icon: '📊', label: 'Spending Insights', desc: 'Track your spending habits' },
    { icon: '❓', label: 'Help & Support', desc: 'FAQs and contact support' },
    { icon: '📄', label: 'Terms & Conditions', desc: 'Legal and privacy info' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh', transition: 'background 0.2s ease' }}>
      <PayPalHeader />
      <div className="container page-enter" style={{ maxWidth: '800px', padding: '24px 16px 100px 16px' }}>
        <div className="page-header" style={{ padding: '0 0 var(--space-md)' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Merchant Settings</h2>
        </div>

        {/* User Card */}
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0070BA, #003087)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0,
          }}>
            {(user?.first_name || user?.firstName)?.[0] || 'J'}{(user?.last_name || user?.lastName)?.[0] || 'L'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600 }}>
              {user?.first_name || user?.firstName || 'Jordan'} {user?.last_name || user?.lastName || 'Lee'}
            </p>
            <p className="text-muted" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'merchant@payback.ai'} • PayPal Verified Merchant
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-lg)' }}>
          {menuItems.map((item) => (
            <button key={item.label} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 0, borderBottom: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              background: 'transparent', color: 'var(--text-primary)',
              border: 'none', fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn btn-danger" id="logout-btn" style={{ marginBottom: 'var(--space-2xl)' }}>
          Sign Out
        </button>

        <p className="text-center text-muted" style={{ fontSize: '0.75rem', paddingBottom: 'var(--space-lg)' }}>
          PayBack AI by PayPal • PayPal AI Hackathon 2026 Edition • Disputes API v1
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
