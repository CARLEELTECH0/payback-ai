'use client';

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
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <h2>Settings</h2>
        </div>

        {/* User Card */}
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0,
          }}>
            {user?.first_name?.[0] || '?'}{user?.last_name?.[0] || ''}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600 }}>
              {user?.first_name || 'User'} {user?.last_name || ''}
            </p>
            <p className="text-muted" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'user@example.com'}
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

        <p className="text-center text-muted" style={{ fontSize: '0.7rem', paddingBottom: 'var(--space-lg)' }}>
          AutoPay Nigeria v1.0.0 • Powered by Interswitch
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
