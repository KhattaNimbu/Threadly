'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/meeting/new',
    label: 'New Meeting',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 13l3-4 3 2 3-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/ask',
    label: 'Ask AI',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5.5 7a.5.5 0 100-1 .5.5 0 000 1zM8 7a.5.5 0 100-1 .5.5 0 000 1zM10.5 7a.5.5 0 100-1 .5.5 0 000 1z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--color-surface-3)', borderWidth: '0.5px' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--color-purple)' }}
          >
            M
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
            Threadly
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5 list-none p-0 m-0">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 no-underline"
                style={{
                  color: isActive(item.href) ? 'var(--color-purple)' : 'var(--color-ink-2)',
                  background: isActive(item.href) ? 'var(--color-purple-light)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.background = 'var(--color-surface-2)';
                    e.currentTarget.style.color = 'var(--color-ink)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-ink-2)';
                  }
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div
        className="px-4 py-4 border-t flex items-center gap-3"
        style={{ borderColor: 'var(--color-surface-3)', borderWidth: '0.5px' }}
      >
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
        <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          Account
        </span>
      </div>
    </aside>
  );
}
