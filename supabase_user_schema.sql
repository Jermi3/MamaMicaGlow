-- ============================================
-- MAMA MICA GLOW - USER DATA SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferences JSONB DEFAULT '{
    "notifications": true,
    "soundEffects": true,
    "hapticFeedback": true,
    "darkMode": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PEPTIDE STACKS TABLE
-- Stores the user's active peptide protocols
-- ============================================
CREATE TABLE IF NOT EXISTS user_peptide_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide_id UUID REFERENCES peptides(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused')),
  color TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- For offline sync
  local_id TEXT, -- Original local ID for matching
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOSE LOGS TABLE
-- Stores all logged doses for history tracking
-- ============================================
CREATE TABLE IF NOT EXISTS dose_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  dose_type TEXT DEFAULT 'Injection' CHECK (dose_type IN ('Injection', 'Oral')),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  -- For offline sync
  local_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOSE SCHEDULES TABLE
-- Stores scheduled dose reminders
-- ============================================
CREATE TABLE IF NOT EXISTS dose_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide TEXT NOT NULL,
  amount TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  days_of_week INTEGER[] DEFAULT '{}',
  schedule_time TEXT, -- "09:00" format
  enabled BOOLEAN DEFAULT true,
  notification_ids TEXT[], -- For canceling notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- For offline sync
  local_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_peptide_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_schedules ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Peptide Stacks: Users can only access their own stacks
CREATE POLICY "Users can view own stacks" ON user_peptide_stacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stacks" ON user_peptide_stacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stacks" ON user_peptide_stacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stacks" ON user_peptide_stacks
  FOR DELETE USING (auth.uid() = user_id);

-- Dose Logs: Users can only access their own logs
CREATE POLICY "Users can view own logs" ON dose_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON dose_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON dose_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON dose_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Dose Schedules: Users can only access their own schedules
CREATE POLICY "Users can view own schedules" ON dose_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules" ON dose_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules" ON dose_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules" ON dose_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON user_peptide_stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON dose_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_logged_at ON dose_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON dose_schedules(user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_peptide_stacks_updated_at
  BEFORE UPDATE ON user_peptide_stacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dose_schedules_updated_at
  BEFORE UPDATE ON dose_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
