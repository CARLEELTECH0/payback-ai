'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('merchant@payback.ai');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleQuickDemoLogin = async () => {
    setDemoLoading(true);
    setErrors({});
    try {
      await login('merchant@payback.ai', 'Password123!');
      showToast('Authenticated as PayPal Demo Merchant (Jordan Lee)', 'success');
      router.push('/payback');
    } catch (err) {
      setErrors({ form: err.message || 'Demo login failed' });
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) return setErrors({ email: 'Email is required' });
    if (!password) return setErrors({ password: 'Password is required' });

    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
      router.push('/payback');
    } catch (err) {
      setErrors({ form: err.message || 'Login failed' });
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg-primary)', padding: '40px 16px' }}>
      <div className="container page-enter" style={{ maxWidth: 440 }}>
        {/* Logo & Branding */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #0070BA 0%, #003087 100%)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: '0 8px 24px rgba(0, 112, 186, 0.35)',
          }}>
            🛡️
          </div>
          <h1 style={{ marginBottom: 4, color: 'var(--text-primary)', fontSize: '1.75rem' }}>PayBack AI</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            PayPal Merchant Copilot & Autonomous Defense
          </p>
        </div>

        <div className="card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-lg)' }}>
          {/* One-Click Demo Access Box */}
        <div style={{
          background: 'rgba(0, 112, 186, 0.08)',
          border: '1px solid rgba(0, 112, 186, 0.25)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0070BA', letterSpacing: '0.5px' }}>
              PAYPAL HACKATHON EVALUATOR ACCESS
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
            Jump straight into the Resolution Center copilot with full sandbox merchant permissions.
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={demoLoading || loading}
            id="demo-login-btn"
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#FFC439',
              color: '#003087',
              borderRadius: '24px',
              fontWeight: '800',
              fontSize: '13.5px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(255, 196, 57, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            {demoLoading ? (
              <span>Authenticating Jordan Lee...</span>
            ) : (
              <>
                <svg viewBox="0 0 240 240" width="18" height="18" fill="none">
                  <path d="M58 35 h58 c24 0 42 13 42 37 c0 25 -20 41 -46 41 h-22 l-12 72 h-20 z" fill="#0079C1" />
                  <path d="M82 62 h56 c22 0 39 12 39 35 c0 24 -19 39 -43 39 h-21 l-11 67 h-20 z" fill="#00457C" opacity="0.9" />
                </svg>
                <span>⚡ 1-Click Demo Merchant Login</span>
              </>
            )}
          </button>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {errors.form && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '0.85rem',
            }}>
              {errors.form}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="login-submit"
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing in...
              </span>
            ) : (
              'Sign In with PayPal ID'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px dashed var(--border)',
          borderRadius: '10px',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          <span>Demo Email: <strong style={{ color: 'var(--text-primary)' }}>merchant@payback.ai</strong></span>
          <span>Password: <strong style={{ color: 'var(--text-primary)' }}>Password123!</strong></span>
        </div>
        </div>

        <p className="text-center text-muted" style={{ marginTop: 'var(--space-lg)', fontSize: '0.85rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ fontWeight: 600, color: 'var(--primary)' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}
