-- Add image_url to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create bucket for feed images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed_images', 'feed_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to read feed images
-- (We'll use DROP IF EXISTS to make re-running safe)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'feed_images' );

-- Policy to allow ONLY instructors/admins to upload images
DROP POLICY IF EXISTS "Instructors can upload feed images" ON storage.objects;
CREATE POLICY "Instructors can upload feed images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'feed_images'
    -- Check if user is authenticated AND has specific role
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('instructor', 'super_admin')
    )
);

-- Policy to allow instructors/admins to update their images
DROP POLICY IF EXISTS "Instructors can update feed images" ON storage.objects;
CREATE POLICY "Instructors can update feed images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'feed_images'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('instructor', 'super_admin')
    )
);

-- Policy to allow instructors/admins to delete their images
DROP POLICY IF EXISTS "Instructors can delete feed images" ON storage.objects;
CREATE POLICY "Instructors can delete feed images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'feed_images'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('instructor', 'super_admin')
    )
);
