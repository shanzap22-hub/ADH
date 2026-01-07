-- ============================================
-- FIX: Update Bunny.net Video URLs
-- ============================================

-- Current problem: video_url uses bunny:// protocol
-- Example: bunny://d7becff7-4519-47da-a7b0-64454b21c26d

-- Need to convert to proper Bunny.net iframe URL
-- Format: https://iframe.mediadelivery.net/play/{LIBRARY_ID}/{VIDEO_ID}

-- First, let's see what we have:
SELECT 
    id,
    title,
    video_url,
    SUBSTRING(video_url FROM 9) as video_id  -- Extract ID after "bunny://"
FROM public.chapters
WHERE video_url IS NOT NULL;

-- ============================================
-- MANUAL FIX REQUIRED:
-- ============================================
-- You need to know your Bunny.net Library ID
-- Then run this update:

-- UPDATE public.chapters
-- SET video_url = 'https://iframe.mediadelivery.net/play/YOUR_LIBRARY_ID/' || SUBSTRING(video_url FROM 9)
-- WHERE video_url LIKE 'bunny://%';

-- ============================================
-- EXAMPLE (replace YOUR_LIBRARY_ID):
-- ============================================
-- If your Library ID is: 123456
-- Then run:

-- UPDATE public.chapters
-- SET video_url = 'https://iframe.mediadelivery.net/play/123456/' || SUBSTRING(video_url FROM 9)
-- WHERE video_url LIKE 'bunny://%';

-- This will convert:
-- bunny://d7becff7-4519-47da-a7b0-64454b21c26d
-- TO:
-- https://iframe.mediadelivery.net/play/123456/d7becff7-4519-47da-a7b0-64454b21c26d

-- ============================================
-- Verify after update:
-- ============================================
SELECT id, title, video_url
FROM public.chapters
WHERE video_url IS NOT NULL;
