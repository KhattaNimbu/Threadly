import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Button from '@/components/ui/Button';

export default async function LandingPage() {
  const { userId } = await auth();

  // If already signed in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)', color: 'var(--color-ink)' }}>
      {/* Navbar */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-surface-3)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--color-purple)' }}
          >
            M
          </div>
          <span className="font-semibold text-lg">Threadly</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium no-underline hover:opacity-80 transition-opacity" style={{ color: 'var(--color-ink-2)' }}>
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" size="md">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium" style={{ background: 'var(--color-purple-light)', color: 'var(--color-purple)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-purple)' }} />
          Gemini 1.5 Powered
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl tracking-tight leading-tight mb-6">
          Turn messy meetings into <span className="font-serif italic" style={{ color: 'var(--color-purple)' }}>structured intelligence</span>
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mb-10" style={{ color: 'var(--color-ink-2)' }}>
          Threadly uses AI to extract decisions, assign action items, and find cross-meeting patterns. Stop taking notes and start taking action.
        </p>
        
        <div className="flex items-center gap-4 flex-col sm:flex-row">
          <Link href="/sign-up">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
              Start for free
            </Button>
          </Link>
          <Link href="#features" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-ink-2)' }}>
            See how it works v
          </Link>
        </div>

        {/* Feature Preview Image/Mockup area */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl relative" style={{ border: '0.5px solid var(--color-surface-3)' }}>
            <div className="aspect-video bg-white w-full flex flex-col items-center justify-center border-b" style={{ borderColor: 'var(--color-surface-3)' }}>
                <div className="text-center space-y-4 max-w-md px-6 py-12">
                     <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ background: 'var(--color-teal-light)' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                               <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                               <path d="M8 12L11 15L16 9" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                     </div>
                     <h3 className="text-xl font-bold">Instantly processed</h3>
                     <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>Paste your transcript and let AI extract summaries, decisions, and action items in seconds.</p>
                </div>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm border-t" style={{ borderColor: 'var(--color-surface-3)', color: 'var(--color-ink-3)' }}>
        <p>(c) {new Date().getFullYear()} Threadly. Built with Next.js, Clerk, Supabase, and Gemini.</p>
      </footer>
    </div>
  );
}
