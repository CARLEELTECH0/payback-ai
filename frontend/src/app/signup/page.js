'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      await signup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      showToast('Account created! Welcome to PayBack AI', 'success');
      router.push('/payback');
    } catch (err) {
      setErrors({ form: err.message || 'Signup failed' });
      showToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: 'firstName', label: 'First Name', type: 'text', placeholder: 'Jordan', half: true },
    { id: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Lee', half: true },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'merchant@example.com' },
    { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 408 555 0199' },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', padding: 'var(--space-xl) 0' }}>
      <div className="container page-enter">
        <div className="text-center" style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ marginBottom: 4 }}>Create Account</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Join PayBack AI Merchant Network</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {errors.form && (
            <div style={{
              padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)',
              color: 'var(--error)', fontSize: '0.85rem',
            }}>
              {errors.form}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            {fields.filter(f => f.half).map(field => (
              <div className="input-group" key={field.id}>
                <label htmlFor={field.id}>{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  className={`input ${errors[field.id] ? 'input-error' : ''}`}
                  placeholder={field.placeholder}
                  value={form[field.id]}
                  onChange={update(field.id)}
                />
                {errors[field.id] && <span className="error-text">{errors[field.id]}</span>}
              </div>
            ))}
          </div>

          {fields.filter(f => !f.half).map(field => (
            <div className="input-group" key={field.id}>
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                type={field.type}
                className={`input ${errors[field.id] ? 'input-error' : ''}`}
                placeholder={field.placeholder}
                value={form[field.id]}
                onChange={update(field.id)}
                autoComplete={field.type === 'password' ? 'new-password' : field.id}
              />
              {errors[field.id] && <span className="error-text">{errors[field.id]}</span>}
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={loading} id="signup-submit" style={{ marginTop: 8 }}>
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted" style={{ marginTop: 'var(--space-xl)', fontSize: '0.85rem' }}>
          Already have an account? <Link href="/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
