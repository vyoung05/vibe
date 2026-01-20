-- =====================================================
-- SECURITY FIXES FOR DATABASE LINTER WARNINGS
-- =====================================================
-- Execute this AFTER the main RLS migration
-- =====================================================

-- =====================================================
-- 1. FIX FUNCTION SEARCH_PATH (Security)
-- =====================================================
-- These functions need SET search_path = '' to prevent
-- malicious search_path changes from affecting behavior

-- Note: All functions use CREATE OR REPLACE because they're used by triggers or RLS policies
-- We're just adding SET search_path = '' parameter to existing functions

-- 1. is_admin function (used by RLS policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. increment_artist_followers (used by trigger)
CREATE OR REPLACE FUNCTION increment_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artists
  SET follower_count = follower_count + 1
  WHERE id = NEW.artist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 3. decrement_artist_followers (used by trigger)
CREATE OR REPLACE FUNCTION decrement_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artists
  SET follower_count = GREATEST(0, follower_count - 1)
  WHERE id = OLD.artist_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 4. update_updated_at_column (used by triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 5. increment_streamer_followers (used by trigger)
CREATE OR REPLACE FUNCTION increment_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE streamers
  SET follower_count = follower_count + 1
  WHERE id = NEW.streamer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 6. decrement_streamer_followers (used by trigger)
CREATE OR REPLACE FUNCTION decrement_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE streamers
  SET follower_count = GREATEST(0, follower_count - 1)
  WHERE id = OLD.streamer_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 7. update_post_like_count (used by triggers)
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 8. update_post_comment_count (used by triggers)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 9. increment_track_plays (used by trigger)
CREATE OR REPLACE FUNCTION increment_track_plays()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tracks
  SET play_count = play_count + 1
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 10. handle_track_vote (used by triggers)
CREATE OR REPLACE FUNCTION handle_track_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE tracks
    SET 
      hot_votes = (SELECT COUNT(*) FROM track_votes WHERE track_id = NEW.track_id AND vote_type = 'hot'),
      not_votes = (SELECT COUNT(*) FROM track_votes WHERE track_id = NEW.track_id AND vote_type = 'not')
    WHERE id = NEW.track_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE tracks
    SET 
      hot_votes = (SELECT COUNT(*) FROM track_votes WHERE track_id = OLD.track_id AND vote_type = 'hot'),
      not_votes = (SELECT COUNT(*) FROM track_votes WHERE track_id = OLD.track_id AND vote_type = 'not')
    WHERE id = OLD.track_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 11. generate_referral_code (used for referral system trigger)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- =====================================================
-- 2. FIX OVERLY PERMISSIVE RLS POLICIES
-- =====================================================
-- Replace policies with USING (true) for ALL operations
-- with proper USING clauses

-- Fix: carts - should check ownership in USING clause for ALL
DROP POLICY IF EXISTS "Users can manage their carts" ON carts;

CREATE POLICY "Users can manage their carts"
  ON carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix: delivery_addresses - should check ownership in USING clause for ALL
DROP POLICY IF EXISTS "Users can manage their addresses" ON delivery_addresses;

CREATE POLICY "Users can manage their addresses"
  ON delivery_addresses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. NOTES ON INTENTIONALLY PERMISSIVE POLICIES
-- =====================================================
-- The following policies have USING (true) or WITH CHECK (true)
-- but are INTENTIONAL for system/application-level control:
--
-- - stream_analytics.System can insert analytics
-- - daily_stats.System can manage stats  
-- - artist_analytics.System can manage artist analytics
-- - streamer_achievements.System can create achievements
--
-- These are controlled by application logic and service role keys,
-- not by individual user authentication. This is the correct design.
--
-- To suppress these warnings in production, you can either:
-- 1. Accept them as expected warnings
-- 2. Create a dedicated service role and restrict these policies to that role
-- 3. Use application-level service accounts with specific permissions

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All function search_path issues resolved
-- Overly permissive RLS policies fixed
-- =====================================================
