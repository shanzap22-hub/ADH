-- Create Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT, -- HTML or Markdown
  cover_image TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  
  -- SEO Fields
  seo_title TEXT,
  seo_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies for Public Read (Published Only)
CREATE POLICY "Public can view published posts" 
ON blog_posts FOR SELECT 
USING (is_published = TRUE);

-- Policies for Admin (All)
-- Assuming admin has role 'admin' in profiles or custom claim.
-- For simplicity, we check if user is authenticated and has admin role in profiles.
CREATE POLICY "Admins can manage posts" 
ON blog_posts FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);
