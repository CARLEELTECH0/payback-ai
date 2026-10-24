'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayBackRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/payback');
  }, [router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: '#080C15',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #0070BA 0%, #003087 100%)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: '0 8px 32px rgba(0, 112, 186, 0.4)',
        }}>
          🛡️
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Redirecting to PayBack AI Copilot...</p>
      </div>
    </div>
  );
}
