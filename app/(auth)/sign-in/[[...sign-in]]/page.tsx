import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--color-purple)' }}
          >
            M
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Threadly
          </span>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
