-- =====================================================
-- FIX STREAMER ADMIN RLS POLICIES
-- =====================================================
-- The previous policies used an inline subquery to check for admin role.
-- This can cause issues with RLS on the users table (recursion or restricted access).
-- 
-- Solution: Use the is_admin() helper function which is SECURITY DEFINER.
-- =====================================================

-- 1. streamers table
DROP POLICY IF EXISTS "Admins can manage streamers" ON streamers;

CREATE POLICY "Admins can manage streamers"
  ON streamers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 2. streamer_social_links table
DROP POLICY IF EXISTS "Admins can manage streamer social links" ON streamer_social_links;

CREATE POLICY "Admins can manage streamer social links"
  ON streamer_social_links FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 3. streamer_header_images table
DROP POLICY IF EXISTS "Admins can manage streamer header images" ON streamer_header_images;

CREATE POLICY "Admins can manage streamer header images"
  ON streamer_header_images FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add a comment to indicate the fix
COMMENT ON TABLE streamers IS 'Streamers table with RLS - uses is_admin() to prevent recursion issues';
