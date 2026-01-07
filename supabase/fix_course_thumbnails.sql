-- Fix Course Thumbnail URLs
-- This script checks and fixes broken thumbnail URLs

-- 1. Check current thumbnail URLs
SELECT 
    id,
    title,
    image_url,
    CASE 
        WHEN image_url IS NULL THEN 'No image'
        WHEN image_url LIKE '%supabase.co%' THEN 'Supabase URL'
        ELSE 'Other URL'
    END as url_type
FROM courses
WHERE instructor_id = auth.uid()
ORDER BY created_at DESC;

-- 2. List files in course-thumbnails bucket (run this in Supabase SQL Editor)
-- SELECT name, created_at FROM storage.objects WHERE bucket_id = 'course-thumbnails';

-- 3. If you want to clear broken image URLs (optional - run only if needed)
-- UPDATE courses 
-- SET image_url = NULL 
-- WHERE image_url LIKE '%0.9293761601341781.jpg%'
-- AND instructor_id = auth.uid();

-- 4. After clearing, you can re-upload images through the UI
