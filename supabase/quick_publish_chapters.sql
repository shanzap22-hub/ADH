-- ============================================
-- QUICK FIX: Publish All Chapters with Videos
-- Run this NOW in Supabase SQL Editor
-- ============================================

-- This will publish all chapters that have videos uploaded
UPDATE public.chapters
SET is_published = true
WHERE video_url IS NOT NULL
AND video_url != '';

-- Verify what was published
SELECT 
    id,
    title,
    is_published,
    is_free,
    video_url,
    position
FROM public.chapters
ORDER BY position;

-- ============================================
-- RESULT:
-- This will immediately make your 2 chapters
-- with videos visible to students!
-- ============================================
