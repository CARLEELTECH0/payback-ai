'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const quickActions = [
  { href: '/payments/airtime', label: 'Airtime', icon: '📱', color: 'airtime' },
  { href: '/payments/data', label: 'Data', icon: '📶', color: 'data' },
  { href: '/payments/electricity', label: 'Electric', icon: '⚡', color: 'electricity' },
  { href: '/payments/transfer', label: 'Transfer', icon: '💰', color: 'transfer' },
];

const typeIcons = {
  airtime: { icon: '📱', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  data: { icon: '📶', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
  electricity: { icon: '⚡', bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  fund_transfer: { icon: '💰', bg: 'rgba(0, 166, 81, 0.15)', color: '#00A651' },
  wallet_funding: { icon: '💳', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
};

const statusColors = {
  success: 'badge-success',
  failed: 'badge-error',
  processing: 'badge-warning',
  pending: 'badge-pending',
  refunded: 'badge-info',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [walletRes, historyRes] = await Promise.allSettled([
        api.getBalance(),
        api.getHistory({ limit: 5 }),
      ]);

      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWalletData(walletRes.value.data);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value.success) {
        setTransactions(historyRes.value.data.transactions || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  };

  const balance = walletData?.balance ?? user?.wallet?.balance ?? 0;

  return (
    <div className="page">
      <div className="container page-enter">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-md) 0 var(--space-sm)' }}>
          <div>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Welcome back</p>
            <h3 style={{ fontWeight: 700 }}>
              {user?.first_name || 'User'} 👋
            </h3>
          </div>
          <Link href="/settings" className="btn-icon btn-ghost" style={{ fontSize: '1.4rem' }}>
            👤
          </Link>
        </div>

        {/* Wallet Card */}
        <div className="section">
          <div className="wallet-card">
            <p className="wallet-balance-label">Available Balance</p>
            <div className="flex items-center gap-sm">
              <p className={`wallet-balance ${balanceHidden ? 'wallet-balance-hidden' : ''}`}>
                ₦{balanceHidden ? '••••••' : formatAmount(balance)}
              </p>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', position: 'relative', zIndex: 1,
                }}
              >
                {balanceHidden ? '👁️' : '🙈'}
              </button>
            </div>
            <div className="flex gap-sm" style={{ position: 'relative', zIndex: 1 }}>
              <Link href="/wallet/fund" className="btn btn-sm" style={{
                background: 'rgba(255,255,255,0.2)', color: 'white', width: 'auto',
                backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
              }}>
                + Fund Wallet
              </Link>
            </div>
          </div>
        </div>

        {/* Interswitch Smart Modules (Hackathon Pitch Section) */}
        <div className="section" style={{ marginBottom: 'var(--space-xl)' }}>
          <p className="section-title">Interswitch Smart Modules</p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)',
          }}>
            <Link href="/payments/electricity" className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Energy</p>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Auto-fund Pre-paid Meters</p>
            </Link>

            <Link href="/payments/transfer" className="card" style={{ padding: 'var(--space-md)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>AgriPay</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Bulk Subsidy & Transfers</p>
            </Link>

            <Link href="/autopay" className="card" style={{ padding: 'var(--space-md)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏠</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>RentAuto</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Smart Rent Savings & Auto-pay</p>
            </Link>

            <Link href="/autopay" className="card" style={{ padding: 'var(--space-md)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏥</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>HealthSaver</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Micro-HMO Auto Deductions</p>
            </Link>

            <Link href="/payments/transfer" className="card" style={{ padding: 'var(--space-md)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌍</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cross-Border</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Diaspora Utility Remittance</p>
            </Link>

            <Link href="/payments/airtime" className="card" style={{ padding: 'var(--space-md)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📶</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Connectivity</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Data & Airtime Core</p>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="section">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title" style={{ margin: 0 }}>Recent Transactions</p>
            <Link href="/history" className="btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
              See All →
            </Link>
          </div>

          <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="tx-item">
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: '40%', height: 10 }} />
                  </div>
                  <div className="skeleton" style={{ width: 60, height: 14 }} />
                </div>
              ))
            ) : transactions.length > 0 ? (
              transactions.map((tx) => {
                const typeInfo = typeIcons[tx.type] || typeIcons.airtime;
                return (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-icon" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                      {typeInfo.icon}
                    </div>
                    <div className="tx-details">
                      <p className="tx-title" style={{ textTransform: 'capitalize' }}>
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="tx-subtitle">{tx.target} • {formatDate(tx.created_at)}</p>
                    </div>
                    <div className="tx-amount">
                      <p className="tx-amount-value">₦{formatAmount(tx.amount)}</p>
                      <p className={`tx-amount-status ${statusColors[tx.status]?.replace('badge-', 'text-') || ''}`}
                         style={{ textTransform: 'capitalize' }}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-title">No transactions yet</p>
                <p className="empty-state-text">Start by buying airtime or paying a bill</p>
              </div>
            )}
          </div>
        </div>

        {/* AutoPay Promo */}
        <div className="section" style={{ marginBottom: 'var(--space-2xl)' }}>
          <Link href="/autopay" className="card" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
            background: 'linear-gradient(135deg, rgba(0, 166, 81, 0.08), rgba(59, 130, 246, 0.05))',
            border: '1px solid rgba(0, 166, 81, 0.15)',
          }}>
            <span style={{ fontSize: '2rem' }}>🤖</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Set up AutoPay</p>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Automate recurring payments</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
