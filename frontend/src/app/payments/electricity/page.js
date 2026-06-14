'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

const discos = [
  { code: 'IKEDC', name: 'Ikeja Electric', region: 'Lagos (Ikeja)' },
  { code: 'EKEDC', name: 'Eko Electric', region: 'Lagos (Eko)' },
  { code: 'AEDC', name: 'Abuja Electric', region: 'Abuja' },
  { code: 'PHEDC', name: 'PH Electric', region: 'Port Harcourt' },
  { code: 'KAEDC', name: 'Kaduna Electric', region: 'Kaduna' },
  { code: 'JEDC', name: 'Jos Electric', region: 'Jos' },
  { code: 'IBEDC', name: 'Ibadan Electric', region: 'Ibadan' },
  { code: 'BEDC', name: 'Benin Electric', region: 'Benin' },
  { code: 'EEDC', name: 'Enugu Electric', region: 'Enugu' },
];

const presets = [1000, 2000, 5000, 10000, 20000, 50000];

export default function ElectricityPage() {
  const [disco, setDisco] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { refreshWallet } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!disco) errs.disco = 'Select a distribution company';
    if (!meterNumber || meterNumber.length < 10) errs.meterNumber = 'Enter a valid meter number';
    if (!amount || Number(amount) < 500) errs.amount = 'Minimum ₦500';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      const res = await api.payElectricity({ meterNumber, amount: Number(amount), disco });
      const token = res.data?.token;
      showToast(token ? `Payment successful! Token: ${token}` : 'Electricity payment successful!', 'success');
      refreshWallet();
      router.push('/dashboard');
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error');
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <Link href="/payments" className="page-back">←</Link>
          <h2>Pay Electricity</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="input-group">
            <label htmlFor="disco">Distribution Company</label>
            <select id="disco" className={`input ${errors.disco ? 'input-error' : ''}`}
              value={disco} onChange={(e) => setDisco(e.target.value)}>
              <option value="">Select your DisCo</option>
              {discos.map((d) => (
                <option key={d.code} value={d.code}>{d.name} — {d.region}</option>
              ))}
            </select>
            {errors.disco && <span className="error-text">{errors.disco}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="meter">Meter Number</label>
            <input id="meter" type="text" className={`input ${errors.meterNumber ? 'input-error' : ''}`}
              placeholder="Enter prepaid meter number" value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)} maxLength={20} />
            {errors.meterNumber && <span className="error-text">{errors.meterNumber}</span>}
          </div>

          <div>
            <p className="section-title">Amount</p>
            <div className="amount-presets" style={{ marginBottom: 'var(--space-md)' }}>
              {presets.map((p) => (
                <button key={p} type="button"
                  className={`amount-preset ${Number(amount) === p ? 'selected' : ''}`}
                  onClick={() => setAmount(String(p))}>
                  ₦{p.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="input-group">
              <label htmlFor="amount">Or enter custom amount</label>
              <input id="amount" type="number" className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="₦ Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                min="500" max="100000" />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>
          </div>

          {amount && Number(amount) >= 500 && (
            <div className="card" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
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
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₦{(Number(amount) + 10).toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} id="electricity-submit">
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Processing...
              </span>
            ) : 'Pay Electricity'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
