'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

const networks = [
  { id: 'MTN', name: 'MTN', className: 'mtn' },
  { id: 'GLO', name: 'GLO', className: 'glo' },
  { id: 'AIRTEL', name: 'Airtel', className: 'airtel' },
  { id: '9MOBILE', name: '9mobile', className: 'ninemobile' },
];

const presets = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimePage() {
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { refreshWallet } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!network) errs.network = 'Select a network';
    if (!/^(\+234|0)[789]\d{9}$/.test(phone)) errs.phone = 'Enter a valid phone number';
    if (!amount || Number(amount) < 50) errs.amount = 'Minimum ₦50';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      const res = await api.buyAirtime({ phone, amount: Number(amount), network });
      showToast(`₦${Number(amount).toLocaleString()} airtime sent successfully!`, 'success');
      refreshWallet();
      router.push('/dashboard');
    } catch (err) {
      showToast(err.message || 'Airtime purchase failed', 'error');
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <Link href="/dashboard" className="page-back">←</Link>
          <h2>Buy Airtime</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Network Selector */}
          <div>
            <p className="section-title">Select Network</p>
            <div className="network-grid">
              {networks.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`network-option ${network === n.id ? 'selected' : ''}`}
                  onClick={() => setNetwork(n.id)}
                >
                  <div className={`network-logo ${n.className}`}>
                    {n.name.substring(0, 3)}
                  </div>
                  <span className="network-name">{n.name}</span>
                </button>
              ))}
            </div>
            {errors.network && <span className="error-text">{errors.network}</span>}
          </div>

          {/* Phone Number */}
          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              className={`input ${errors.phone ? 'input-error' : ''}`}
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          {/* Amount */}
          <div>
            <p className="section-title">Amount</p>
            <div className="amount-presets" style={{ marginBottom: 'var(--space-md)' }}>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`amount-preset ${Number(amount) === p ? 'selected' : ''}`}
                  onClick={() => setAmount(String(p))}
                >
                  ₦{p.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="input-group">
              <label htmlFor="amount">Or enter custom amount</label>
              <input
                id="amount"
                type="number"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="₦ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50"
                max="50000"
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>
          </div>

          {/* Summary */}
          {amount && Number(amount) >= 50 && (
            <div className="card" style={{ background: 'rgba(0, 166, 81, 0.05)', border: '1px solid rgba(0, 166, 81, 0.15)' }}>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Amount</span>
                <span style={{ fontWeight: 600 }}>₦{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Service fee</span>
                <span style={{ fontWeight: 600 }}>₦10.00</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div className="flex justify-between">
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ₦{(Number(amount) + 10).toLocaleString()}.00
                  </span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} id="airtime-submit">
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Processing...
              </span>
            ) : 'Buy Airtime'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
