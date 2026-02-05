-- =====================================================
-- RLS DEBUG SCRIPT
-- =====================================================
-- Run this in the Supabase SQL Editor and share the results.
-- =====================================================

-- 1. Check current authenticated user
SELECT auth.uid() as current_uid;

-- 2. Check user record in public.users
SELECT id, email, role 
FROM public.users 
WHERE id = auth.uid();

-- 3. Check is_admin() result
SELECT is_admin();

-- 4. Check all policies on streamers table
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'streamers';
