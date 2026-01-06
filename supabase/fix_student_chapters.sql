-- ============================================
-- FIX: Students Cannot See Videos/Chapters
-- COMPLETE FIX - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add RLS Policy for Students to View Published Chapters
-- This allows students to see chapters if:
-- 1. Chapter is published AND
-- 2. Chapter is free OR student has purchased the course

DROP POLICY IF EXISTS "Students can view published chapters" ON public.chapters;
CREATE POLICY "Students can view published chapters"
ON public.chapters FOR SELECT
USING (
    is_published = true
    AND EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = chapters.course_id
        AND is_published = true
    )
    AND (
        is_free = true
        OR EXISTS (
            SELECT 1 FROM public.purchases
            WHERE user_id = auth.uid()
            AND course_id = chapters.course_id
        )
    )
);

-- Step 2: Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'chapters'
ORDER BY policyname;

-- Step 3: Check published chapters with videos
SELECT 
    c.id,
    c.title,
    c.is_published,
    c.is_free,
    c.video_url,
    c.position,
    co.title as course_title,
    co.is_published as course_published
FROM public.chapters c
JOIN public.courses co ON co.id = c.course_id
WHERE co.is_published = true
ORDER BY co.title, c.position;

-- Step 4: Count chapters by status
SELECT 
    COUNT(*) as total_chapters,
    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published_chapters,
    SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) as unpublished_chapters,
    SUM(CASE WHEN video_url IS NOT NULL THEN 1 ELSE 0 END) as chapters_with_video,
    SUM(CASE WHEN video_url IS NULL THEN 1 ELSE 0 END) as chapters_without_video
FROM public.chapters;

-- ============================================
-- TROUBLESHOOTING:
-- ============================================
-- If students still can't see videos:
--
-- 1. Check Query 3 results:
--    - If 0 rows: No published chapters exist
--    - If video_url is NULL: Videos not uploaded/saved
--    - If is_published = false: Chapters not published
--
-- 2. Instructor needs to:
--    - Upload video to chapter
--    - Click "Save" button
--    - Click "Publish" button on chapter
--    - Ensure course is also published
--
-- 3. Student needs to:
--    - Either: Chapter is marked as "free" (is_free = true)
--    - Or: Student has purchased the course (entry in purchases table)
-- ============================================
