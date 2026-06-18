'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import api from '@/lib/api';

const typeIcons = {
  airtime: { icon: '📱', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  data: { icon: '📶', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
  electricity: { icon: '⚡', bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  fund_transfer: { icon: '💰', bg: 'rgba(0, 166, 81, 0.15)', color: '#00A651' },
  wallet_funding: { icon: '💳', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
};

const statusBadge = {
  success: 'badge-success',
  failed: 'badge-error',
  processing: 'badge-warning',
  pending: 'badge-pending',
  refunded: 'badge-info',
};

const filters = [
  { value: '', label: 'All' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'electricity', label: 'Electric' },
  { value: 'fund_transfer', label: 'Transfer' },
];

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [activeFilter, page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeFilter) params.type = activeFilter;
      const res = await api.getHistory(params);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const formatAmount = (a) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(a);

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <h2>Transaction History</h2>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto', paddingBottom: 'var(--space-md)',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {filters.map((f) => (
            <button key={f.value}
              className={`btn btn-sm ${activeFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: 'auto', flexShrink: 0, padding: '8px 16px' }}
              onClick={() => { setActiveFilter(f.value); setPage(1); }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="tx-item">
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '80%', height: 10 }} />
                </div>
                <div className="skeleton" style={{ width: 60, height: 14 }} />
              </div>
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx) => {
              const info = typeIcons[tx.type] || typeIcons.airtime;
              return (
                <div key={tx.id} className="tx-item">
                  <div className="tx-icon" style={{ background: info.bg, color: info.color }}>
                    {info.icon}
                  </div>
                  <div className="tx-details">
                    <p className="tx-title" style={{ textTransform: 'capitalize' }}>{tx.type.replace('_', ' ')}</p>
                    <p className="tx-subtitle">{tx.target} • {formatDate(tx.created_at)}</p>
                    <p className="tx-subtitle" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Ref: {tx.reference}</p>
                  </div>
                  <div className="tx-amount">
                    <p className="tx-amount-value">₦{formatAmount(tx.amount)}</p>
                    <span className={`badge ${statusBadge[tx.status] || ''}`} style={{ marginTop: 4 }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-2xl) 0' }}>
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-title">No transactions found</p>
              <p className="empty-state-text">
                {activeFilter ? `No ${activeFilter} transactions yet` : 'Your transactions will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-md" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }}
              disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }}
              disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
