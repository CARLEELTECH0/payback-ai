'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

const typeLabels = { airtime: '📱 Airtime', data: '📶 Data', electricity: '⚡ Electricity' };

export default function AutoPayPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'airtime', target: '', amount: '', schedule: '0 8 * * *' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.getAutopayRules();
      if (res.success) setRules(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const scheduleLabels = {
    '0 8 * * *': 'Daily at 8:00 AM',
    '0 8 * * 1': 'Weekly (Monday 8 AM)',
    '0 8 1 * *': 'Monthly (1st at 8 AM)',
    '0 8 15 * *': 'Monthly (15th at 8 AM)',
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.target || !form.amount) {
      showToast('Fill in all fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.createAutopayRule({
        type: form.type,
        target: form.target,
        amount: Number(form.amount),
        schedule: form.schedule,
      });
      showToast('AutoPay rule created!', 'success');
      setShowForm(false);
      setForm({ type: 'airtime', target: '', amount: '', schedule: '0 8 * * *' });
      loadRules();
    } catch (err) {
      showToast(err.message || 'Failed to create rule', 'error');
    } finally { setSubmitting(false); }
  };

  const toggleRule = async (rule) => {
    try {
      await api.updateAutopayRule(rule.id, { is_active: !rule.is_active });
      showToast(rule.is_active ? 'Rule paused' : 'Rule activated', 'success');
      loadRules();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this AutoPay rule?')) return;
    try {
      await api.deleteAutopayRule(id);
      showToast('Rule deleted', 'success');
      loadRules();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="page">
      <div className="container page-enter">
        <div className="page-header">
          <h2>AutoPay Rules</h2>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto' }}
            onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Rule'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card" style={{
            marginBottom: 'var(--space-lg)',
            background: 'rgba(0, 166, 81, 0.03)', border: '1px solid rgba(0, 166, 81, 0.15)',
          }}>
            <p style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>New AutoPay Rule</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Payment Type</label>
                <select className="input" value={form.type}
                  onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="airtime">📱 Airtime / Data</option>
                  <option value="electricity">⚡ Energy (Electricity)</option>
                  <option value="rent">🏠 RentAuto (Savings Lock)</option>
                  <option value="health">🏥 HealthSaver (HMO Premium)</option>
                  <option value="agri">🌱 AgriPay (Subsidy Disburse)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Target Account / Meter / Phone</label>
                <input className="input" placeholder="Account Number or Phone"
                  value={form.target} onChange={(e) => setForm(p => ({ ...p, target: e.target.value }))} />
              </div>

              <div className="input-group">
                <label>Amount (₦)</label>
                <input className="input" type="number" placeholder="₦ Amount" value={form.amount}
                  onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} min="50" />
              </div>

              <div className="input-group">
                <label>Schedule</label>
                <select className="input" value={form.schedule}
                  onChange={(e) => setForm(p => ({ ...p, schedule: e.target.value }))}>
                  {Object.entries(scheduleLabels).map(([cron, label]) => (
                    <option key={cron} value={cron}>{label}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </form>
        )}

        {/* Rules List */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 12 }} />
            </div>
          ))
        ) : rules.length > 0 ? (
          rules.map((rule) => (
            <div key={rule.id} className="card" style={{
              marginBottom: 'var(--space-md)',
              opacity: rule.is_active ? 1 : 0.6,
              borderLeft: `3px solid ${rule.is_active ? 'var(--primary)' : 'var(--text-muted)'}`,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {typeLabels[rule.type] || rule.type}
                </span>
                <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-pending'}`}>
                  {rule.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 4 }}>
                To: {rule.target} • ₦{Number(rule.amount).toLocaleString()}
              </p>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
                Schedule: {scheduleLabels[rule.schedule] || rule.schedule}
                {rule.total_runs > 0 && ` • ${rule.total_runs} runs`}
              </p>
              <div className="flex gap-sm">
                <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}
                  onClick={() => toggleRule(rule)}>
                  {rule.is_active ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', fontSize: '0.8rem' }}
                  onClick={() => deleteRule(rule.id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <p className="empty-state-title">No AutoPay rules yet</p>
            <p className="empty-state-text">Set up automatic recurring payments for airtime, data, or electricity</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)', width: 'auto' }}
              onClick={() => setShowForm(true)}>
              + Create First Rule
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
