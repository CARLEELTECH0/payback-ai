'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

export default function TransferPage() {
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { refreshWallet } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const banks = [
    { code: '044', name: 'Access Bank' },
    { code: '023', name: 'Citibank' },
    { code: '050', name: 'Ecobank' },
    { code: '084', name: 'Enterprise Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'GTBank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC' },
    { code: '068', name: 'Standard Chartered' },
    { code: '232', name: 'Sterling Bank' },
    { code: '032', name: 'Union Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!accountNumber || accountNumber.length !== 10) errs.accountNumber = 'Enter a valid 10-digit account number';
    if (!bankCode) errs.bankCode = 'Select a bank';
    if (!amount || Number(amount) < 100) errs.amount = 'Minimum ₦100';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      await api.transferFunds({
        destinationAccountNumber: accountNumber,
        destinationInstitutionCode: bankCode,
        destinationAccountName: accountName,
        amount: Number(amount),
        narration,
      });
      showToast(`₦${Number(amount).toLocaleString()} transferred successfully!`, 'success');
      refreshWallet();
      router.push('/dashboard');
    } catch (err) {
      showToast(err.message || 'Transfer failed', 'error');
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
          <h2>Transfer Funds</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {errors.form && (
            <div style={{ padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)',
              color: 'var(--error)', fontSize: '0.85rem' }}>
              {errors.form}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="bank">Destination Bank</label>
            <select id="bank" className={`input ${errors.bankCode ? 'input-error' : ''}`}
              value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
              <option value="">Select bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
            {errors.bankCode && <span className="error-text">{errors.bankCode}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="acctNum">Account Number</label>
            <input id="acctNum" type="text" className={`input ${errors.accountNumber ? 'input-error' : ''}`}
              placeholder="0123456789" value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10} inputMode="numeric" />
            {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="acctName">Account Name (optional)</label>
            <input id="acctName" type="text" className="input"
              placeholder="Recipient name" value={accountName}
              onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div className="input-group">
            <label htmlFor="amount">Amount (₦)</label>
            <input id="amount" type="number" className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="Enter amount" value={amount}
              onChange={(e) => setAmount(e.target.value)} min="100" max="5000000" />
            {errors.amount && <span className="error-text">{errors.amount}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="narration">Narration (optional)</label>
            <input id="narration" type="text" className="input"
              placeholder="What is this for?" value={narration}
              onChange={(e) => setNarration(e.target.value)} maxLength={100} />
          </div>

          {amount && Number(amount) >= 100 && (
            <div className="card" style={{ background: 'rgba(0, 166, 81, 0.05)', border: '1px solid rgba(0, 166, 81, 0.15)' }}>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Amount</span>
                <span style={{ fontWeight: 600 }}>₦{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Transfer fee</span>
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

          <button type="submit" className="btn btn-primary" disabled={loading} id="transfer-submit">
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Processing...
              </span>
            ) : 'Transfer Funds'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
