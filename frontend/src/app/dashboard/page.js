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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const balance = walletData?.balance ? Number(walletData.balance) : 19450.00;

  return (
    <div className="page">
      <div className="container page-enter">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-md) 0 var(--space-sm)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#38BDF8', background: 'rgba(0, 112, 186, 0.15)', padding: '2px 8px', borderRadius: '12px', marginBottom: '4px' }}>
              <span>🅿️</span> PAYPAL MERCHANT SERVICES
            </div>
            <h3 style={{ fontWeight: 800, color: '#F8FAFC' }}>
              {user?.first_name || 'Jordan'} Lee 👋
            </h3>
          </div>
          <Link href="/settings" className="btn-icon btn-ghost" style={{ fontSize: '1.4rem' }}>
            👤
          </Link>
        </div>

        {/* Flagship Hero: PayBack AI Copilot Card */}
        <div className="section" style={{ marginBottom: 'var(--space-md)' }}>
          <Link href="/payback" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 112, 186, 0.3) 0%, rgba(0, 48, 135, 0.4) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 'var(--radius-xl)',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0, 112, 186, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0070BA 0%, #10B981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 4px 16px rgba(0, 112, 186, 0.4)',
                }}>
                  🛡️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>PayBack AI Copilot</span>
                    <span style={{ fontSize: '10px', fontWeight: '700', background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: '8px' }}>LIVE</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                    Autonomous 60s PayPal dispute defense • 96% win rate
                  </p>
                </div>
              </div>
              <span style={{ color: '#38BDF8', fontSize: '1.2rem', fontWeight: 800 }}>→</span>
            </div>
          </Link>
        </div>

        {/* PayPal Merchant Balance Card */}
        <div className="section">
          <div className="wallet-card">
            <p className="wallet-balance-label" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 600 }}>
              PayPal Merchant Balance (USD)
            </p>
            <div className="flex items-center gap-sm" style={{ marginTop: '4px' }}>
              <p className={`wallet-balance ${balanceHidden ? 'wallet-balance-hidden' : ''}`} style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                {balanceHidden ? '••••••' : formatAmount(balance)}
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
            <div className="flex gap-sm" style={{ position: 'relative', zIndex: 1, marginTop: '14px' }}>
              <Link href="/payments" className="btn btn-sm" style={{
                background: '#FFC439', color: '#003087', width: 'auto', fontWeight: 700,
                border: 'none', borderRadius: '20px', padding: '6px 16px',
              }}>
                Transfer Funds
              </Link>
              <Link href="/payback" className="btn btn-sm" style={{
                background: 'rgba(255,255,255,0.15)', color: 'white', width: 'auto',
                backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '6px 14px',
              }}>
                Dispute Radar
              </Link>
            </div>
          </div>
        </div>

        {/* PayPal AI Platform Solutions */}
        <div className="section" style={{ marginBottom: 'var(--space-xl)' }}>
          <p className="section-title" style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            PayPal AI Platform Solutions
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)',
          }}>
            <Link href="/payback" className="card" style={{ padding: 'var(--space-md)', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>Dispute Shield</p>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>PayPal Disputes API v1 Auto-Defense</p>
            </Link>

            <Link href="/payback" className="card" style={{ padding: 'var(--space-md)', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>Pay in 4 Bailout</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>Failed Recurring Churn Rescue</p>
            </Link>

            <Link href="/payback" className="card" style={{ padding: 'var(--space-md)', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>Live Telemetry</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>1.4s Webhook Evidence Assembler</p>
            </Link>

            <Link href="/payback" className="card" style={{ padding: 'var(--space-md)', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
               <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚖️</div>
               <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>Forensic Dossier</p>
               <p className="text-muted" style={{ fontSize: '0.75rem' }}>5-Point Formal Legal Briefs</p>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="section">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title" style={{ margin: 0 }}>Recent Activity</p>
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
                      <p className="tx-amount-value">{formatAmount(tx.amount)}</p>
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
                <div className="empty-state-icon">🛡️</div>
                <p className="empty-state-title">No transactions yet</p>
                <p className="empty-state-text">Transactions and disputes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
