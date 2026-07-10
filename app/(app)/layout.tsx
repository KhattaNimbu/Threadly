import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ResponsiveShell from '@/components/layout/ResponsiveShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <ResponsiveShell>{children}</ResponsiveShell>
    </div>
  );
}
