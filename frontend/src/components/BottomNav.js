'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/payback', label: 'PayBack AI', icon: '🛡️' },
  { href: '/dashboard', label: 'Merchant Hub', icon: '💼' },
  { href: '/payments', label: 'Send & Pay', icon: '💳' },
  { href: '/history', label: 'Activity', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            id={`nav-${item.label.toLowerCase()}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
