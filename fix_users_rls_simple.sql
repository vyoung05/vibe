-- =====================================================
-- ALTERNATIVE FIX: Simpler approach for users table
-- =====================================================
-- Instead of checking role in policies, just allow basic access
-- and handle authorization in application code

-- Drop all admin-checking policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Simple policies without recursion:

-- 1. Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile  
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Allow signup (users can insert their own profile during registration)
DROP POLICY IF EXISTS "Users can create own profile during signup" ON users;
CREATE POLICY "Users can create own profile during signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- For admin operations, you'll need to:
-- 1. Disable RLS temporarily for admin operations using service_role key
-- 2. Or use Supabase Functions with service role permissions
-- 3. Or create a SECURITY DEFINER function that bypasses RLS

COMMENT ON TABLE users IS 'Users table with simple RLS - admin ops use service role';
