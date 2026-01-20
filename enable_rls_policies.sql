-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This migration enables RLS on all public tables and creates
-- appropriate access policies to protect user data.
-- 
-- Execute this in the Supabase SQL Editor
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. USER RELATIONSHIP TABLES (Owner-Only Access)
-- =====================================================

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can create referrals for themselves"
  ON referrals FOR INSERT
  WITH CHECK (referrer_id = auth.uid());

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invitations"
  ON invitations FOR SELECT
  USING (inviter_id = auth.uid() OR invited_user_id = auth.uid());

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (inviter_id = auth.uid());

-- =====================================================
-- 2. STREAMER TABLES
-- =====================================================

-- Streamer Social Links (Owner/Related Entity Access)
ALTER TABLE streamer_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streamer social links"
  ON streamer_social_links FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their own social links"
  ON streamer_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_social_links.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Streamer Header Images
ALTER TABLE streamer_header_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streamer header images"
  ON streamer_header_images FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their own header images"
  ON streamer_header_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_header_images.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Stream Schedules
ALTER TABLE stream_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stream schedules"
  ON stream_schedules FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their own schedules"
  ON stream_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = stream_schedules.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Streamer Booking Settings
ALTER TABLE streamer_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booking settings"
  ON streamer_booking_settings FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their own booking settings"
  ON streamer_booking_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_booking_settings.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Booking Services
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booking services"
  ON booking_services FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their booking services"
  ON booking_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamer_booking_settings sbs
      JOIN streamers s ON s.id = sbs.streamer_id
      WHERE sbs.id = booking_services.booking_settings_id
      AND s.user_id = auth.uid()
    )
  );

-- Streamer Events
ALTER TABLE streamer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public streamer events"
  ON streamer_events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Streamers can view all their events"
  ON streamer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_events.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

CREATE POLICY "Streamers can manage their events"
  ON streamer_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_events.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Streamer Achievements
ALTER TABLE streamer_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streamer achievements"
  ON streamer_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can create achievements"
  ON streamer_achievements FOR INSERT
  WITH CHECK (true); -- Controlled by application logic

-- Streamer Followers
ALTER TABLE streamer_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follower counts"
  ON streamer_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow streamers"
  ON streamer_followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow streamers"
  ON streamer_followers FOR DELETE
  USING (follower_id = auth.uid());

-- Bookmarked Streamers
ALTER TABLE bookmarked_streamers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bookmarks"
  ON bookmarked_streamers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark streamers"
  ON bookmarked_streamers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove bookmarks"
  ON bookmarked_streamers FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 3. ARTIST TABLES
-- =====================================================

-- Artist Header Images
ALTER TABLE artist_header_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist header images"
  ON artist_header_images FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage their header images"
  ON artist_header_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artists
      WHERE artists.id = artist_header_images.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- Artist Social Links
ALTER TABLE artist_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist social links"
  ON artist_social_links FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage their social links"
  ON artist_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artists
      WHERE artists.id = artist_social_links.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- Artist Booking Settings
ALTER TABLE artist_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist booking settings"
  ON artist_booking_settings FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage their booking settings"
  ON artist_booking_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artists
      WHERE artists.id = artist_booking_settings.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- Artist Events
ALTER TABLE artist_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist events"
  ON artist_events FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage their events"
  ON artist_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artists
      WHERE artists.id = artist_events.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- Album Tracks (Junction Table)
ALTER TABLE album_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view album tracks"
  ON album_tracks FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage their album tracks"
  ON album_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM albums
      JOIN artists ON artists.id = albums.artist_id
      WHERE albums.id = album_tracks.album_id
      AND artists.user_id = auth.uid()
    )
  );

-- Artist Followers
ALTER TABLE artist_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist followers"
  ON artist_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow artists"
  ON artist_followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow artists"
  ON artist_followers FOR DELETE
  USING (follower_id = auth.uid());

-- Track Votes (Hot or Not)
ALTER TABLE track_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view track votes"
  ON track_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on tracks"
  ON track_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their votes"
  ON track_votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their votes"
  ON track_votes FOR DELETE
  USING (user_id = auth.uid());

-- Track Purchases
ALTER TABLE track_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their purchases"
  ON track_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can purchase tracks"
  ON track_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. POSTS & CONTENT TABLES
-- =====================================================

-- Post Saves
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved posts"
  ON post_saves FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save posts"
  ON post_saves FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave posts"
  ON post_saves FOR DELETE
  USING (user_id = auth.uid());

-- Video Content
ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view free and public videos"
  ON video_content FOR SELECT
  USING (visibility IN ('public', 'free'));

CREATE POLICY "Superfans can view superfan videos"
  ON video_content FOR SELECT
  USING (
    visibility = 'superfan' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tier = 'superfan'
    )
  );

CREATE POLICY "Streamers can manage their videos"
  ON video_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = video_content.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Video Likes
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video likes"
  ON video_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like videos"
  ON video_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike videos"
  ON video_likes FOR DELETE
  USING (user_id = auth.uid());

-- Video Comments
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video comments"
  ON video_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON video_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their comments"
  ON video_comments FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 5. ADMIN-ONLY TABLES
-- =====================================================

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (is_admin());

-- Verification Requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests"
  ON verification_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all verification requests"
  ON verification_requests FOR ALL
  USING (is_admin());

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can manage all reports"
  ON reports FOR ALL
  USING (is_admin());

-- =====================================================
-- 6. CHAT & MESSAGING TABLES
-- =====================================================

-- Chat Rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active chat rooms"
  ON chat_rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Streamers can manage their chat rooms"
  ON chat_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = chat_rooms.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations they're part of"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- =====================================================
-- 7. ANALYTICS TABLES (Owner-Only)
-- =====================================================

-- Stream Analytics
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streamers can view their analytics"
  ON stream_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = stream_analytics.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON stream_analytics FOR INSERT
  WITH CHECK (true);

-- Daily Stats
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streamers can view their stats"
  ON daily_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = daily_stats.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage stats"
  ON daily_stats FOR ALL
  WITH CHECK (true);

-- Artist Analytics
ALTER TABLE artist_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view their analytics"
  ON artist_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artists
      WHERE artists.id = artist_analytics.artist_id
      AND artists.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage artist analytics"
  ON artist_analytics FOR ALL
  WITH CHECK (true);

-- =====================================================
-- 8. MERCHANT MARKETPLACE TABLES
-- =====================================================

-- Merchants (Public Read-Only)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active merchants"
  ON merchants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage merchants"
  ON merchants FOR ALL
  USING (is_admin());

-- Merchant Hours
ALTER TABLE merchant_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view merchant hours"
  ON merchant_hours FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage merchant hours"
  ON merchant_hours FOR ALL
  USING (is_admin());

-- Merchant Items
ALTER TABLE merchant_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available items"
  ON merchant_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can manage items"
  ON merchant_items FOR ALL
  USING (is_admin());

-- Product Images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL
  USING (is_admin());

-- Item Option Groups
ALTER TABLE item_option_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item options"
  ON item_option_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage item options"
  ON item_option_groups FOR ALL
  USING (is_admin());

-- Option Choices
ALTER TABLE option_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view option choices"
  ON option_choices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage option choices"
  ON option_choices FOR ALL
  USING (is_admin());

-- Delivery Addresses (Owner-Only)
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their addresses"
  ON delivery_addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their addresses"
  ON delivery_addresses FOR ALL
  WITH CHECK (user_id = auth.uid());

-- Carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their carts"
  ON carts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their carts"
  ON carts FOR ALL
  WITH CHECK (user_id = auth.uid());

-- Cart Items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their cart items"
  ON cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Selected Options
ALTER TABLE selected_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view options for their cart items"
  ON selected_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cart_items
      JOIN carts ON carts.id = cart_items.cart_id
      WHERE cart_items.id = selected_options.cart_item_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage options for their cart items"
  ON selected_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cart_items
      JOIN carts ON carts.id = cart_items.cart_id
      WHERE cart_items.id = selected_options.cart_item_id
      AND carts.user_id = auth.uid()
    )
  );

-- Discounts (Public Read, Admin Write)
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts"
  ON discounts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage discounts"
  ON discounts FOR ALL
  USING (is_admin());

-- =====================================================
-- 9. ORDER & MERCH TABLES
-- =====================================================

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Merch Products
ALTER TABLE merch_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active merch"
  ON merch_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage merch products"
  ON merch_products FOR ALL
  USING (is_admin());

-- Merch Product Images
ALTER TABLE merch_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view merch images"
  ON merch_product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage merch images"
  ON merch_product_images FOR ALL
  USING (is_admin());

-- Merch Variants
ALTER TABLE merch_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view merch variants"
  ON merch_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage variants"
  ON merch_variants FOR ALL
  USING (is_admin());

-- Promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  USING (is_admin());

-- Merch Order Items
ALTER TABLE merch_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their merch order items"
  ON merch_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merch_orders
      WHERE merch_orders.id = merch_order_items.order_id
      AND merch_orders.user_id = auth.uid()
    )
  );

-- =====================================================
-- 10. FEE & PAYMENT TABLES (Admin-Only)
-- =====================================================

-- Streamer Fee Status
ALTER TABLE streamer_fee_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streamers can view their fee status"
  ON streamer_fee_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_fee_status.streamer_id
      AND streamers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage fee status"
  ON streamer_fee_status FOR ALL
  USING (is_admin());

-- Fee Structures
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fee structures"
  ON fee_structures FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage fee structures"
  ON fee_structures FOR ALL
  USING (is_admin());

-- Superfan Fee Status
ALTER TABLE superfan_fee_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their superfan fee status"
  ON superfan_fee_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage superfan fee status"
  ON superfan_fee_status FOR ALL
  USING (is_admin());

-- Printify Connections (Admin-Only)
ALTER TABLE printify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage printify connections"
  ON printify_connections FOR ALL
  USING (is_admin());

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All 58 tables now have RLS enabled with appropriate policies
-- =====================================================
