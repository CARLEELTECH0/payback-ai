'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function PayPalHeader({ theme: propTheme, onToggleTheme: propOnToggleTheme }) {
  const pathname = usePathname();
  const themeCtx = useTheme();

  const currentTheme = propTheme || themeCtx.theme || 'light';
  const handleToggle = propOnToggleTheme || themeCtx.toggleTheme;
  const isDark = currentTheme === 'dark';
  const navBg = isDark ? '#0A0F1D' : '#001C64';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)';

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/history', label: 'Activity' },
    { href: '/payments', label: 'Pay & Get Paid' },
    { href: '/payback', label: 'Resolution Center', badge: 'AI Copilot' },
    { href: '/settings', label: 'Developer & API' },
  ];

  return (
    <header style={{
      background: navBg,
      borderBottom: `1px solid ${borderColor}`,
      color: '#FFFFFF',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
    }}>
      {/* Top Enterprise Bar */}
      <div style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '0 16px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/payback" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 240 240" width="32" height="32" fill="none">
                <path d="M58 35 h58 c24 0 42 13 42 37 c0 25 -20 41 -46 41 h-22 l-12 72 h-20 z" fill="#0079C1" />
                <path d="M82 62 h56 c22 0 39 12 39 35 c0 24 -19 39 -43 39 h-21 l-11 67 h-20 z" fill="#00457C" opacity="0.9" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.4px', lineHeight: 1 }}>
                  PayPal
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.5px' }}>
                  BUSINESS
                </span>
              </div>
              <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '600', letterSpacing: '0.4px' }}>
                MERCHANT OPERATIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="paypal-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href === '/payback' && pathname.startsWith('/payback'));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#FFFFFF' : '#CBD5E1',
                    background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      background: '#10B981',
                      color: '#FFFFFF',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      letterSpacing: '0.3px',
                    }}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sandbox Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#FFD700',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span>SANDBOX</span>
          </div>

          {/* Theme Switcher Button */}
          <button
            id="theme-toggle-btn"
            onClick={handleToggle}
            title={`Switch to ${isDark ? 'Enterprise Light' : 'Developer Dark'} mode`}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Avatar */}
          <Link href="/settings" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#FFFFFF',
            padding: '4px 8px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#0070BA',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '800',
            }}>
              JL
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600' }} className="hidden-mobile">
              Jordan Lee
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
