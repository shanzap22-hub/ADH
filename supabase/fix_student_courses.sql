-- ============================================
-- FIX: Students Cannot See Courses
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add RLS Policy for Students
DROP POLICY IF EXISTS "Students can view published courses" ON public.courses;
CREATE POLICY "Students can view published courses"
ON public.courses FOR SELECT
USING (is_published = true);

-- Step 2: Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY policyname;

-- Step 3: Check if there are any published courses
SELECT 
    id,
    title,
    is_published,
    instructor_id,
    created_at
FROM public.courses
WHERE is_published = true
ORDER BY created_at DESC;

-- Step 4: Check total courses (published + unpublished)
SELECT 
    COUNT(*) as total_courses,
    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published_courses,
    SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) as unpublished_courses
FROM public.courses;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Query 2: Should show "Students can view published courses" policy
-- Query 3: Should show list of published courses (if any exist)
-- Query 4: Should show count of total vs published courses
--
-- If Query 3 returns 0 rows:
--   → No published courses exist!
--   → Instructors need to publish courses first
--
-- If Query 2 doesn't show the policy:
--   → Policy creation failed
--   → Check for errors in Step 1
-- ============================================
