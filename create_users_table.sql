-- =====================================================
-- CREATE MISSING USERS TABLE
-- =====================================================
-- This table should have been created but is missing from the database
-- Causing 406 errors when users sign up/login
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'superfan')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_type TEXT CHECK (account_type IN ('user', 'streamer', 'artist')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified')),
  is_influencer BOOLEAN DEFAULT FALSE,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Public can view active users
CREATE POLICY "Anyone can view active users"
  ON users FOR SELECT
  USING (account_status = 'active');

-- Users can view their own profile regardless of status
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for generating referral codes
CREATE TRIGGER generate_user_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Apply this SQL in Supabase SQL Editor
-- Then test signup/login flow
-- =====================================================
