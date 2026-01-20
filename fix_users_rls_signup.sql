-- =====================================================
-- FIX USERS TABLE RLS POLICIES FOR SIGNUP
-- =====================================================
-- Allow new users to create their own profile during signup
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a permissive INSERT policy for signup
-- This allows users to create their own profile when auth.uid() matches the id being inserted
CREATE POLICY "Users can create own profile during signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also ensure the SELECT policy allows users to see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id OR account_status = 'active');

-- =====================================================
-- TEST THIS FIX
-- =====================================================
-- After running this SQL:
-- 1. Try signing up with a new account
-- 2. The app should no longer show a blank page
-- 3. The profile should be created successfully
-- =====================================================
