-- =====================================================
-- STREAMER ADMIN RLS POLICIES
-- =====================================================

-- Enable RLS on streamers table
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view streamers" ON streamers;
DROP POLICY IF EXISTS "Admins can manage streamers" ON streamers;

-- Public can view all streamers
CREATE POLICY "Public can view streamers"
  ON streamers FOR SELECT
  USING (true);

-- Admins have full access to streamers
CREATE POLICY "Admins can manage streamers"
  ON streamers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Enable RLS on streamer_social_links table
ALTER TABLE streamer_social_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view streamer social links" ON streamer_social_links;
DROP POLICY IF EXISTS "Admins can manage streamer social links" ON streamer_social_links;

-- Public can view all social links
CREATE POLICY "Public can view streamer social links"
  ON streamer_social_links FOR SELECT
  USING (true);

-- Admins have full access to social links
CREATE POLICY "Admins can manage streamer social links"
  ON streamer_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Enable RLS on streamer_header_images table
ALTER TABLE streamer_header_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view streamer header images" ON streamer_header_images;
DROP POLICY IF EXISTS "Admins can manage streamer header images" ON streamer_header_images;

-- Public can view all header images
CREATE POLICY "Public can view streamer header images"
  ON streamer_header_images FOR SELECT
  USING (true);

-- Admins have full access to header images
CREATE POLICY "Admins can manage streamer header images"
  ON streamer_header_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON TABLE streamers IS 'Streamers table with RLS - public can view, admins can manage';
COMMENT ON TABLE streamer_social_links IS 'Streamer social links with RLS - public can view, admins can manage';
COMMENT ON TABLE streamer_header_images IS 'Streamer header images with RLS - public can view, admins can manage';
