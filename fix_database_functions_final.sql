-- =====================================================
-- FIX DATABASE FUNCTIONS SEARCH_PATH & QUALIFIED NAMES
-- =====================================================
-- This script fixes the "relation does not exist" errors caused by
-- setting search_path = '' without qualifying table names.
-- =====================================================

-- 1. is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. increment_artist_followers
CREATE OR REPLACE FUNCTION increment_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.artists
  SET follower_count = follower_count + 1
  WHERE id = NEW.artist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 3. decrement_artist_followers
CREATE OR REPLACE FUNCTION decrement_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.artists
  SET follower_count = GREATEST(0, follower_count - 1)
  WHERE id = OLD.artist_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 4. increment_streamer_followers
CREATE OR REPLACE FUNCTION increment_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.streamers
  SET follower_count = follower_count + 1
  WHERE id = NEW.streamer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 5. decrement_streamer_followers
CREATE OR REPLACE FUNCTION decrement_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.streamers
  SET follower_count = GREATEST(0, follower_count - 1)
  WHERE id = OLD.streamer_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 6. update_post_like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 7. update_post_comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 8. increment_track_plays
CREATE OR REPLACE FUNCTION increment_track_plays()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tracks
  SET play_count = play_count + 1
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 9. handle_track_vote
CREATE OR REPLACE FUNCTION handle_track_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.tracks
    SET 
      hot_votes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = NEW.track_id AND vote_type = 'hot'),
      not_votes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = NEW.track_id AND vote_type = 'not')
    WHERE id = NEW.track_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.tracks
    SET 
      hot_votes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = OLD.track_id AND vote_type = 'hot'),
      not_votes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = OLD.track_id AND vote_type = 'not')
    WHERE id = OLD.track_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';
