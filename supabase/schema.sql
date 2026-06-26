-- Threadly Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Threadly uses Clerk for auth and the Supabase service role on the server.
-- Keep RLS enabled, but do not rely on Supabase Auth's auth.uid() for access control.
-- Application code enforces per-user ownership by filtering on the Clerk user_id.
GRANT USAGE ON SCHEMA public TO service_role;

-- ─────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          text PRIMARY KEY,              -- Clerk user ID (format: user_xxxx)
  email       text NOT NULL,
  name        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ─────────────────────────────────────────────────────────
-- TABLE: meetings
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text REFERENCES users(id) ON DELETE CASCADE,
  title               text NOT NULL,
  raw_transcript      text,
  summary             text,
  decisions           text[],
  topics              text[],
  participants        text[],
  sentiment           text CHECK (sentiment IN ('productive','tense','unclear','routine')),
  follow_up_needed    boolean DEFAULT false,
  duration_estimate   text,
  met_at              timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can insert own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;

-- ─────────────────────────────────────────────────────────
-- TABLE: action_items
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     text REFERENCES users(id),
  title       text NOT NULL,
  assignee    text,
  due_date    date,
  priority    text CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  completed   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own action items" ON action_items;
DROP POLICY IF EXISTS "Users can insert own action items" ON action_items;
DROP POLICY IF EXISTS "Users can update own action items" ON action_items;
DROP POLICY IF EXISTS "Users can delete own action items" ON action_items;

-- ─────────────────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_created_at_idx ON meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS action_items_meeting_id_idx ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS action_items_user_id_idx ON action_items(user_id);
CREATE INDEX IF NOT EXISTS action_items_due_date_idx ON action_items(due_date);

-- Explicit grants for the server-side service role used by this app.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE meetings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE action_items TO service_role;

-- ─────────────────────────────────────────────────────────
-- TABLE: rate_limits
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  endpoint    text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_user_endpoint_idx ON rate_limits(user_id, endpoint, created_at);

-- RPC for atomic rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id text,
  p_endpoint text,
  p_limit int,
  p_window interval
) RETURNS boolean AS $$
DECLARE
  current_count int;
BEGIN
  -- Clean up old records for this user/endpoint
  DELETE FROM rate_limits 
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND created_at < now() - p_window;
    
  -- Count recent requests
  SELECT count(*) INTO current_count 
  FROM rate_limits 
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint;
    
  IF current_count < p_limit THEN
    INSERT INTO rate_limits (user_id, endpoint) VALUES (p_user_id, p_endpoint);
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rate_limits TO service_role;
