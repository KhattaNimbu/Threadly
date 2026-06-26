import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Ensure user exists in Supabase on first access
  const supabase = createServerSupabase();
  await supabase.from('users').upsert(
    { id: userId, email: '', name: '' },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <div className="main-content flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
