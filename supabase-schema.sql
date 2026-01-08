-- =====================================================
-- DDNS APP - COMPLETE SUPABASE SQL SCHEMA
-- =====================================================
-- This schema supports: Users, Streamers, Artists, Music,
-- Posts, Bookings, Chat, Marketplace, Merch Store, and more
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- User Relationships (Following)
CREATE TABLE user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations (Influencer System)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (inviter_id, invited_user_id)
);

-- =====================================================
-- STREAMER TABLES
-- =====================================================

-- Streamers
CREATE TABLE streamers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gamertag TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  bio TEXT NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  live_stream_url TEXT,
  live_title TEXT,
  last_live_date TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Social Links
CREATE TABLE streamer_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL UNIQUE REFERENCES streamers(id) ON DELETE CASCADE,
  instagram TEXT,
  twitter TEXT,
  tiktok TEXT,
  twitch TEXT,
  youtube TEXT,
  kick TEXT,
  spotify TEXT,
  apple_music TEXT,
  soundcloud TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Header Images
CREATE TABLE streamer_header_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stream Schedule
CREATE TABLE stream_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Booking Settings
CREATE TABLE streamer_booking_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL UNIQUE REFERENCES streamers(id) ON DELETE CASCADE,
  is_bookable BOOLEAN DEFAULT FALSE,
  min_notice_hours INTEGER DEFAULT 24,
  max_bookings_per_day INTEGER DEFAULT 5,
  booking_message TEXT,
  auto_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Services
CREATE TABLE booking_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_settings_id UUID NOT NULL REFERENCES streamer_booking_settings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('shoutout', 'collab', 'private-game', 'event', 'meet-greet', 'coaching', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Events
CREATE TABLE streamer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('stream', 'tournament', 'collab', 'meet-greet', 'special', 'other')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  price DECIMAL(10, 2),
  image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Achievements
CREATE TABLE streamer_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (streamer_id, achievement_id)
);

-- Streamer Followers
CREATE TABLE streamer_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, streamer_id)
);

-- Bookmarked Streamers
CREATE TABLE bookmarked_streamers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, streamer_id)
);

-- =====================================================
-- ARTIST & MUSIC TABLES
-- =====================================================

-- Artists
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  email TEXT,
  avatar TEXT NOT NULL,
  bio TEXT NOT NULL,
  genre TEXT,
  follower_count INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  total_plays INTEGER DEFAULT 0,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  hot_status BOOLEAN DEFAULT FALSE,
  hot_status_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist Header Images
CREATE TABLE artist_header_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist Social Links
CREATE TABLE artist_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
  instagram TEXT,
  twitter TEXT,
  tiktok TEXT,
  twitch TEXT,
  youtube TEXT,
  kick TEXT,
  spotify TEXT,
  apple_music TEXT,
  soundcloud TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist Booking Settings
CREATE TABLE artist_booking_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL UNIQUE REFERENCES artists(id) ON DELETE CASCADE,
  is_bookable BOOLEAN DEFAULT FALSE,
  min_notice_hours INTEGER DEFAULT 24,
  max_bookings_per_day INTEGER DEFAULT 5,
  booking_message TEXT,
  auto_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist Events
CREATE TABLE artist_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('concert', 'album_release', 'livestream', 'meet_greet', 'other')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  ticket_url TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Albums
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_art TEXT NOT NULL,
  price DECIMAL(10, 2),
  release_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks (Music)
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id),
  title TEXT NOT NULL,
  cover_art TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  price DECIMAL(10, 2),
  is_snippet_only BOOLEAN DEFAULT FALSE,
  snippet_duration_seconds INTEGER DEFAULT 30,
  play_count INTEGER DEFAULT 0,
  hot_votes INTEGER DEFAULT 0,
  not_votes INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Album Tracks (Junction Table)
CREATE TABLE album_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (album_id, track_id)
);

-- Artist Followers
CREATE TABLE artist_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, artist_id)
);

-- Track Votes (Hot or Not)
CREATE TABLE track_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('hot', 'not')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (track_id, user_id)
);

-- Track Purchases
CREATE TABLE track_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_paid DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (track_id, user_id)
);

-- =====================================================
-- POSTS & CONTENT TABLES
-- =====================================================

-- Posts (Feed)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_username TEXT NOT NULL,
  user_avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_artist BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
  video_source TEXT CHECK (video_source IN ('local', 'youtube', 'url')),
  caption TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,

  -- Music post specific fields
  is_audio_post BOOLEAN DEFAULT FALSE,
  track_id UUID REFERENCES tracks(id),
  artist_id UUID REFERENCES artists(id),
  hot_votes INTEGER DEFAULT 0,
  not_votes INTEGER DEFAULT 0,
  is_snippet BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Post Saves
CREATE TABLE post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Post Comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Content (Legacy)
CREATE TABLE video_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  streamer_name TEXT NOT NULL,
  streamer_avatar TEXT,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'free', 'superfan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Likes
CREATE TABLE video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (video_id, user_id)
);

-- Video Comments
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES booking_services(id),
  type TEXT NOT NULL CHECK (type IN ('shoutout', 'collab', 'private-game', 'event', 'meet-greet', 'coaching', 'custom')),
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  budget DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed', 'cancelled')),
  streamer_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS & ANNOUNCEMENTS
-- =====================================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('referral', 'follower', 'achievement', 'booking', 'general', 'live', 'music', 'purchase')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VERIFICATION & MODERATION
-- =====================================================

-- Verification Requests
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  reason TEXT NOT NULL,
  social_proof TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT
);

-- Reports (Content Moderation)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_username TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'user', 'comment', 'track')),
  target_id UUID NOT NULL,
  target_user_id UUID REFERENCES users(id),
  target_username TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'fraud', 'hacking', 'hate_speech', 'violence', 'copyright', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  action_taken TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT & MESSAGING
-- =====================================================

-- Chat Rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  streamer_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'superfan')),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'emote', 'system')),
  emote TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct Messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  participant_names TEXT[] NOT NULL,
  participant_avatars TEXT[],
  last_message_id UUID REFERENCES direct_messages(id),
  unread_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS
-- =====================================================

-- Stream Analytics
CREATE TABLE stream_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  stream_title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  peak_viewers INTEGER DEFAULT 0,
  average_viewers INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Stats
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  stream_duration_minutes INTEGER DEFAULT 0,
  stream_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (streamer_id, date)
);

-- Artist Analytics
CREATE TABLE artist_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  plays INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  hot_votes INTEGER DEFAULT 0,
  not_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (artist_id, date)
);

-- =====================================================
-- MERCHANT MARKETPLACE
-- =====================================================

-- Merchants
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  banner_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT TRUE,
  min_order_amount DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2),
  delivery_time TEXT,
  supports_delivery BOOLEAN DEFAULT TRUE,
  supports_pickup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant Hours
CREATE TABLE merchant_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE (merchant_id, day)
);

-- Merchant Items
CREATE TABLE merchant_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  sku TEXT,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES merchant_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Option Groups
CREATE TABLE item_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES merchant_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL CHECK (selection_type IN ('single', 'multiple')),
  is_required BOOLEAN DEFAULT FALSE,
  min_select INTEGER,
  max_select INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Option Choices
CREATE TABLE option_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_group_id UUID NOT NULL REFERENCES item_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta DECIMAL(10, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Addresses
CREATE TABLE delivery_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  subtotal DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES merchant_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_image_url TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  line_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Selected Options
CREATE TABLE selected_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES item_option_groups(id),
  group_name TEXT NOT NULL,
  choice_id UUID NOT NULL REFERENCES option_choices(id),
  choice_name TEXT NOT NULL,
  price_delta DECIMAL(10, 2) DEFAULT 0
);

-- Discounts
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10, 2) NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('item', 'category', 'merchant', 'order')),
  scope_ids UUID[],
  code TEXT UNIQUE,
  min_order_amount DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  merchant_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address_id UUID REFERENCES delivery_addresses(id),
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  tip DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  estimated_time TEXT,
  actual_delivery_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES merchant_items(id),
  item_name TEXT NOT NULL,
  item_image_url TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  line_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MERCHANDISE STORE (PRINTIFY)
-- =====================================================

-- Merch Products
CREATE TABLE merch_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  streamer_name TEXT NOT NULL,
  streamer_avatar TEXT,
  printify_product_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_price DECIMAL(10, 2),
  markup_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

-- Merch Product Images
CREATE TABLE merch_product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES merch_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merch Variants
CREATE TABLE merch_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES merch_products(id) ON DELETE CASCADE,
  printify_variant_id INTEGER,
  title TEXT NOT NULL,
  size TEXT,
  color TEXT,
  additional_price DECIMAL(10, 2) DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage_off', 'fixed_amount_off', 'free_shipping', 'bundle_deal')),
  value DECIMAL(10, 2) NOT NULL,
  code TEXT UNIQUE,
  min_purchase DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'streamers_only', 'superfans_only', 'new_users')),
  applicable_streamer_ids UUID[],
  applicable_categories TEXT[],
  applicable_product_ids UUID[],
  usage_limit INTEGER,
  usage_per_user INTEGER,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'cancelled')),
  is_visible BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merch Orders
CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  promotion_discount DECIMAL(10, 2) DEFAULT 0,
  promotion_id UUID REFERENCES promotions(id),
  promotion_code TEXT,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'payment_confirmed', 'sent_to_printify', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded')),
  printify_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  sent_to_printify_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Merch Order Items
CREATE TABLE merch_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES merch_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES merch_products(id),
  product_title TEXT NOT NULL,
  product_image TEXT,
  variant_id UUID NOT NULL REFERENCES merch_variants(id),
  variant_title TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  streamer_id UUID NOT NULL REFERENCES streamers(id),
  streamer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Structures
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_platform_fee DECIMAL(5, 2) NOT NULL,
  tiktok_rate DECIMAL(5, 2),
  instagram_rate DECIMAL(5, 2),
  our_rate DECIMAL(5, 2),
  streamer_trial_days INTEGER DEFAULT 60,
  superfan_trial_days INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streamer Fee Status
CREATE TABLE streamer_fee_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL UNIQUE REFERENCES streamers(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
  is_in_trial_period BOOLEAN DEFAULT TRUE,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  current_fee_percentage DECIMAL(5, 2),
  total_saved DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Superfan Fee Status
CREATE TABLE superfan_fee_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  is_in_trial_period BOOLEAN DEFAULT TRUE,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  fee_waived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Printify Connections
CREATE TABLE printify_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL UNIQUE REFERENCES streamers(id) ON DELETE CASCADE,
  printify_api_key TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  shop_title TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Streamer indexes
CREATE INDEX idx_streamers_is_live ON streamers(is_live);
CREATE INDEX idx_streamers_user_id ON streamers(user_id);
CREATE INDEX idx_streamer_followers_streamer_id ON streamer_followers(streamer_id);
CREATE INDEX idx_streamer_followers_follower_id ON streamer_followers(follower_id);

-- Artist indexes
CREATE INDEX idx_artists_user_id ON artists(user_id);
CREATE INDEX idx_artists_hot_status ON artists(hot_status);
CREATE INDEX idx_artist_followers_artist_id ON artist_followers(artist_id);
CREATE INDEX idx_artist_followers_follower_id ON artist_followers(follower_id);

-- Track indexes
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_tracks_album_id ON tracks(album_id);
CREATE INDEX idx_tracks_is_hot ON tracks(is_hot);
CREATE INDEX idx_tracks_created_at ON tracks(created_at DESC);

-- Post indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_artist_id ON posts(artist_id);
CREATE INDEX idx_posts_track_id ON posts(track_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- Analytics indexes
CREATE INDEX idx_stream_analytics_streamer_id ON stream_analytics(streamer_id);
CREATE INDEX idx_stream_analytics_start_time ON stream_analytics(start_time DESC);
CREATE INDEX idx_daily_stats_streamer_id_date ON daily_stats(streamer_id, date DESC);
CREATE INDEX idx_artist_analytics_artist_id_date ON artist_analytics(artist_id, date DESC);

-- Order indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Merch indexes
CREATE INDEX idx_merch_products_streamer_id ON merch_products(streamer_id);
CREATE INDEX idx_merch_orders_user_id ON merch_orders(user_id);
CREATE INDEX idx_merch_orders_status ON merch_orders(status);

-- Chat indexes
CREATE INDEX idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver_id ON direct_messages(receiver_id);
CREATE INDEX idx_conversations_participant_ids ON conversations USING GIN(participant_ids);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Booking indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_streamer_id ON bookings(streamer_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

-- Users: Users can read all, but only update their own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Posts: Anyone can read, only owner can modify
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Tracks: Anyone can read, only artist owner can modify
CREATE POLICY "Anyone can view tracks" ON tracks FOR SELECT USING (true);
CREATE POLICY "Artists can manage own tracks" ON tracks FOR ALL USING (
  EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid())
);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Direct Messages: Users can see messages they sent or received
CREATE POLICY "Users can view own messages" ON direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Merch Orders: Users can only see their own
CREATE POLICY "Users can view own merch orders" ON merch_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create merch orders" ON merch_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streamers_updated_at BEFORE UPDATE ON streamers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merch_orders_updated_at BEFORE UPDATE ON merch_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merch_products_updated_at BEFORE UPDATE ON merch_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment follower count
CREATE OR REPLACE FUNCTION increment_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE streamers SET follower_count = follower_count + 1 WHERE id = NEW.streamer_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION decrement_streamer_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE streamers SET follower_count = follower_count - 1 WHERE id = OLD.streamer_id;
  RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_streamer_follower_count AFTER INSERT ON streamer_followers FOR EACH ROW EXECUTE FUNCTION increment_streamer_followers();
CREATE TRIGGER decrement_streamer_follower_count AFTER DELETE ON streamer_followers FOR EACH ROW EXECUTE FUNCTION decrement_streamer_followers();

-- Function to increment artist follower count
CREATE OR REPLACE FUNCTION increment_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artists SET follower_count = follower_count + 1 WHERE id = NEW.artist_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION decrement_artist_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artists SET follower_count = follower_count - 1 WHERE id = OLD.artist_id;
  RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_artist_follower_count AFTER INSERT ON artist_followers FOR EACH ROW EXECUTE FUNCTION increment_artist_followers();
CREATE TRIGGER decrement_artist_follower_count AFTER DELETE ON artist_followers FOR EACH ROW EXECUTE FUNCTION decrement_artist_followers();

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_likes AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_comments AFTER INSERT OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Function to update track play count
CREATE OR REPLACE FUNCTION increment_track_plays(track_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET play_count = play_count + 1 WHERE id = track_uuid;
  UPDATE artists SET total_plays = total_plays + 1
  WHERE id = (SELECT artist_id FROM tracks WHERE id = track_uuid);
END;
$$ language 'plpgsql';

-- Function to handle track votes
CREATE OR REPLACE FUNCTION handle_track_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'hot' THEN
      UPDATE tracks SET hot_votes = hot_votes + 1 WHERE id = NEW.track_id;
    ELSE
      UPDATE tracks SET not_votes = not_votes + 1 WHERE id = NEW.track_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'hot' THEN
      UPDATE tracks SET hot_votes = hot_votes - 1 WHERE id = OLD.track_id;
    ELSE
      UPDATE tracks SET not_votes = not_votes - 1 WHERE id = OLD.track_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'hot' THEN
      UPDATE tracks SET hot_votes = hot_votes - 1 WHERE id = OLD.track_id;
    ELSE
      UPDATE tracks SET not_votes = not_votes - 1 WHERE id = OLD.track_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'hot' THEN
      UPDATE tracks SET hot_votes = hot_votes + 1 WHERE id = NEW.track_id;
    ELSE
      UPDATE tracks SET not_votes = not_votes + 1 WHERE id = NEW.track_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_track_votes AFTER INSERT OR UPDATE OR DELETE ON track_votes FOR EACH ROW EXECUTE FUNCTION handle_track_vote();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_user_referral_code BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =====================================================
-- Note: Create these buckets in your Supabase Dashboard under Storage:
-- 1. avatars - for user/streamer/artist profile pictures
-- 2. posts - for post images and videos
-- 3. tracks - for music audio files
-- 4. covers - for album and track cover art
-- 5. merch - for merchandise product images
-- 6. headers - for profile header images
