'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/meeting/new': 'New Meeting',
  '/tasks': 'Tasks',
  '/insights': 'Insights',
  '/ask': 'Ask AI',
};

interface TopBarProps {
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export default function TopBar({ onToggleSidebar, isMobile = false }: TopBarProps) {
  const pathname = usePathname();

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

  const showNewMeetingButton = pathname !== '/meeting/new';

  return (
    <header
      className="topbar"
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-topbar-bg)',
        borderBottom: '1px solid var(--color-topbar-border)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        transition: 'background 0.2s ease, border-color 0.2s ease',
        gap: '12px',
      }}
    >
      {isMobile && onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            padding: '8px 12px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Menu
        </button>
      )}
      {/* Page title */}
      <div>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {pageName}
        </h1>
      </div>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showNewMeetingButton && (
          <Link
            href="/meeting/new"
            id="topbar-new-meeting-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              background: 'var(--color-primary)',
              textDecoration: 'none',
              transition: 'background 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 2px 8px rgba(89, 50, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-hover)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(89, 50, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(89, 50, 234, 0.3)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Meeting
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
