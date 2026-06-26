import { createServerSupabase } from './supabase/server';

/**
 * Checks if the user is within their rate limit for a specific endpoint.
 *
 * @param userId - The Clerk user ID
 * @param endpoint - Identifier for the endpoint (e.g., 'process-meeting')
 * @param limit - Maximum number of requests allowed in the window
 * @param window - The time window as a Postgres interval string (e.g., '1 hour', '1 minute')
 * @returns boolean - True if allowed, false if rate limited
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  window: string
): Promise<boolean> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window: window,
  });

  if (error) {
    console.error('Rate limit error:', error);
    // Fail open if the database is down or RPC is missing, 
    // or you could choose to fail closed depending on security posture.
    // Given it's a small app, failing closed might be safer for costs, but open is better for UX.
    // Let's fail closed to strictly protect costs.
    return false;
  }

  return data as boolean;
}
