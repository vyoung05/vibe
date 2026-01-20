-- =====================================================
-- VERIFY USERS TABLE AND FIX ISSUES
-- =====================================================
-- Check if users table exists and diagnose the 406 error
-- =====================================================

-- Step 1: Check if table exists and view structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Step 3: Check existing policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Step 4: Check if any users exist
SELECT COUNT(*) as user_count FROM users;

-- Step 5: Check auth.users vs public.users sync
SELECT 
  COUNT(DISTINCT au.id) as auth_users,
  COUNT(DISTINCT pu.id) as public_users
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id;

-- =====================================================
-- If the table exists but users from auth.users are
-- missing from public.users, you need to sync them
-- =====================================================
