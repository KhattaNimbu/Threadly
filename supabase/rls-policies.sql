-- Example RLS policies for Threadly
-- Location: supabase/rls-policies.sql
--
-- This file provides two sets of example policies:
-- 1) Policies for projects using Supabase Auth (auth.uid()).
-- 2) Guidance and recommended policies when using an external
--    auth provider such as Clerk with a server-proxy pattern.
--
-- IMPORTANT: The service_role key bypasses RLS. Keep it server-only.
-- IMPORTANT: If you are using Clerk and do NOT use Supabase Auth in the browser,
--            DO NOT APPLY the Supabase Auth example policies below.
--            They only make sense when client requests are authenticated with
--            Supabase Auth and auth.uid() is available.

-- ------------------------------
-- Option A — Supabase Auth (auth.uid())
-- ------------------------------
-- Only enable these if your clients authenticate with Supabase Auth
-- and the JWT `auth.uid()` claim is populated for end users.

-- Users table: allow users to manage their profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Meetings: users can only access their own meetings
CREATE POLICY IF NOT EXISTS "Users can select own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Action items: allow access if the action item belongs to the user
-- OR if the parent meeting belongs to the user
CREATE POLICY IF NOT EXISTS "Users can select own action items"
  ON public.action_items FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert own action items"
  ON public.action_items FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update own action items"
  ON public.action_items FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete own action items"
  ON public.action_items FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id AND m.user_id = auth.uid()
    )
  );

-- ------------------------------
-- Option B — Clerk (external auth) with server-proxy pattern
-- ------------------------------
-- If you use Clerk (or another external provider) and do not use
-- Supabase Auth for client authentication, two recommended approaches:
--
-- A) Keep RLS enabled but implement strict server-side endpoints.
--    Your server endpoints validate Clerk sessions and call Supabase
--    with the service role key (server-only). In this pattern, clients
--    never talk directly to Supabase, so RLS primarily protects
--    accidental direct access.
--
-- B) If you want client-side direct DB access while using Clerk,
--    you must mint Supabase-compatible JWTs for clients (advanced)
--    or mirror the Clerk user id in Supabase Auth. Many teams avoid
--    this complexity and use server-proxy requests instead.

-- Example minimal policy that denies all client-side access by default
-- (useful if you strictly proxy all DB access through server endpoints):
-- when RLS is enabled and no matching policy exists, access is denied.
-- In the Clerk/server-proxy pattern this is usually sufficient and safe.

-- Note: do NOT create permissive client-side policies here if you rely on
-- the server-proxy pattern — instead, rely on your server endpoints.

-- ------------------------------
-- Apply notes
-- ------------------------------
-- Run this file in your Supabase SQL editor after reviewing which
-- auth strategy you will use. If you're using Clerk and the server
-- proxy pattern, you can keep the Supabase Auth-based policies
-- commented out or omit them entirely.

-- End of rls-policies.sql
