import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Button from '@/components/ui/Button';

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Navbar */}
      <header
        style={{
          height: '64px',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #5932EA 0%, #8B60F5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(89, 50, 234, 0.35)',
            }}
          >
            M
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>Threadly</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/sign-in"
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          >
            Sign in
          </Link>
          <Link href="/sign-up" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        {/* Badge pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '100px',
            background: 'var(--color-primary-muted)',
            color: 'var(--color-primary)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '32px',
            border: '1px solid var(--color-primary-muted2)',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
          Powered by Gemini AI
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 700,
            maxWidth: '880px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 24px',
            color: 'var(--color-text-primary)',
          }}
        >
          Turn messy meetings into{' '}
          <span
            style={{
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-primary)',
            }}
          >
            structured intelligence
          </span>
        </h1>

        <p
          style={{
            fontSize: '18px',
            maxWidth: '560px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 40px',
            lineHeight: 1.7,
          }}
        >
          Threadly uses AI to extract decisions, assign action items, and find cross-meeting patterns. Stop taking notes and start taking action.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/sign-up" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              Start for free - it&apos;s free
            </Button>
          </Link>
          <Link
            href="/sign-in"
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          >
            See how it works &darr;
          </Link>
        </div>

        {/* Feature Preview Card */}
        <div
          style={{
            marginTop: '72px',
            width: '100%',
            maxWidth: '960px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.10)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28C840' }} />
            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Threadly.app/dashboard
            </span>
          </div>
          <div
            style={{
              padding: '48px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'var(--color-success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Instantly processed
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '400px', textAlign: 'center', margin: 0 }}>
              Paste your transcript and let AI extract summaries, decisions, and action items in seconds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '28px',
          textAlign: 'center',
          fontSize: '13px',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()}{' '}Threadly. Built with Next.js, Clerk, Supabase &amp; Gemini.
        </p>
      </footer>
    </div>
  );
}
