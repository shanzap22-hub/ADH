-- ============================================
-- QUICK FIX: Update Video URLs to Proper Format
-- ============================================

-- OPTION 1: If you know your Library ID
-- Replace 'YOUR_LIBRARY_ID' with your actual Bunny.net Library ID
-- Example: If Library ID is 123456, replace YOUR_LIBRARY_ID with 123456

UPDATE public.chapters
SET video_url = 'https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/' || SUBSTRING(video_url FROM 9)
WHERE video_url LIKE 'bunny://%';

-- ============================================
-- OPTION 2: Find your Library ID
-- ============================================
-- 1. Login to https://dash.bunny.net
-- 2. Go to "Stream" → "Libraries"
-- 3. Click on your library
-- 4. Copy the "Library ID" (it's a number like 123456)

-- ============================================
-- After Update, Verify:
-- ============================================
SELECT 
    id,
    title,
    video_url
FROM public.chapters
WHERE video_url IS NOT NULL;

-- Expected result:
-- video_url should look like:
-- https://iframe.mediadelivery.net/embed/123456/d7becff7-4519-47da-a7b0-64454b21c26d
