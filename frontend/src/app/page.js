'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Flagship entrypoint for PayPal AI Hackathon 2026: Route directly to PayBack Copilot
    router.replace('/payback');
  }, [router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: '#080C15',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #0070BA 0%, #003087 100%)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: '0 8px 32px rgba(0, 112, 186, 0.4)',
          animation: 'pulse 1.8s ease infinite',
        }}>
          🛡️
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>Initializing PayBack AI Copilot...</p>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
