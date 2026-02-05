-- =====================================================
-- FIX INFINITE RECURSION IN USERS TABLE RLS POLICIES
-- =====================================================
-- The issue: policies were checking the users table to verify admin role,
-- which creates infinite recursion when users try to query the table.
--
-- Solution: Use auth.jwt() to check role from the JWT token instead of
-- querying the users table.

-- First, drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;

-- Now create non-recursive policies using JWT claims
-- Note: The role is stored in the JWT token's user_metadata

-- Users can view their own profile (no recursion)
-- Keep existing policy: "Users can view own profile"

-- Users can update their own profile (no recursion)
-- Keep existing policy: "Users can update own profile"

-- Admins can view all users (using JWT, no table query)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Admins can update all users (using JWT)
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Admins can delete users (using JWT)
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Admins can insert users (using JWT)
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- IMPORTANT: You need to ensure the user's role is included in the JWT token
-- This is done in Supabase by updating the user's metadata
-- Example: UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"') WHERE email = 'your-admin@email.com';

COMMENT ON TABLE users IS 'Users table with RLS - policies use JWT role to avoid recursion';
