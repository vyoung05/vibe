# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details and create the project
4. Wait for the database to be provisioned

## 2. Get Your API Keys

1. Go to Project Settings > API
2. Copy the `Project URL` (EXPO_PUBLIC_SUPABASE_URL)
3. Copy the `anon public` key (EXPO_PUBLIC_SUPABASE_ANON_KEY)
4. Add these to your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create Database Tables

Go to the SQL Editor in your Supabase dashboard and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Saves table
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Saves policies
CREATE POLICY "Saves are viewable by owner"
  ON saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can save posts"
  ON saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own saves"
  ON saves FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_saves_post_id ON saves(post_id);
CREATE INDEX idx_saves_user_id ON saves(user_id);

-- Helper functions for incrementing/decrementing counts
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET like_count = like_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comment_count = comment_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comment_count = GREATEST(comment_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

## 4. Test the Setup

After running the SQL, verify that all tables were created:
1. Go to Table Editor in Supabase dashboard
2. You should see: users, posts, comments, likes, saves

## 5. Environment Setup

Make sure your `.env` file has:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Ready to Use!

Your backend is now configured and ready. The app will automatically:
- Create user profiles on signup
- Store posts, comments, likes, and saves
- Enforce permissions (users can only edit/delete their own content)
