-- ============================================
-- FINAL FIX: Replace YOUR_LIBRARY_ID with 574533
-- ============================================

UPDATE public.chapters
SET video_url = REPLACE(video_url, 'YOUR_LIBRARY_ID', '574533')
WHERE video_url LIKE '%YOUR_LIBRARY_ID%';

-- ============================================
-- Verify the fix:
-- ============================================
SELECT 
    id,
    title,
    video_url
FROM public.chapters
WHERE video_url IS NOT NULL;

-- Expected result:
-- video_url should now be:
-- https://iframe.mediadelivery.net/embed/574533/d7becff7-4519-47da-a7b0-64454b21c26d
-- https://iframe.mediadelivery.net/embed/574533/9e42177a-18a0-4721-b9bd-bbcca4ff83e5
