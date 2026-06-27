import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from './supabase/server';

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  if (!user) {
    return null;
  }

  const primaryEmailId = user.primaryEmailAddressId;
  const primaryEmail = user.emailAddresses.find((email) => email.id === primaryEmailId);

  return primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
}

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return fullName || user.username || null;
}

export async function syncAuthenticatedUser(userId: string): Promise<void> {
  const user = await currentUser();

  if (!user) {
    return;
  }

  const email = getPrimaryEmail(user);
  const name = getDisplayName(user);

  if (!email) {
    return;
  }

  const supabase = createServerSupabase();

  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
      email,
      name,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}
