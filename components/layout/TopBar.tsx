'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/meeting/new': 'New Meeting',
  '/tasks': 'Tasks',
  '/insights': 'Insights',
  '/ask': 'Ask AI',
};

export default function TopBar() {
  const pathname = usePathname();

  // Determine current page name
  let pageName = 'Threadly';
  if (pathname.startsWith('/meeting/') && pathname !== '/meeting/new') {
    pageName = 'Meeting Detail';
  } else {
    for (const [path, name] of Object.entries(pageNames)) {
      if (pathname === path || pathname.startsWith(path + '/')) {
        pageName = name;
        break;
      }
    }
  }

  return (
    <header
      className="h-12 flex items-center justify-between px-6 sticky top-0 z-30 bg-white"
      style={{ borderBottom: '0.5px solid var(--color-surface-3)' }}
    >
      <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
        {pageName}
      </span>
      <Link
        href="/meeting/new"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-150"
        style={{ background: 'var(--color-ink)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-ink-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-ink)';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        New Meeting
      </Link>
    </header>
  );
}
