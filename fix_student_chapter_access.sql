-- Fix Missing Student Access to Chapters
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled (just to be safe/consistent)
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- 2. Add policy for Students/Public to view published chapters
DROP POLICY IF EXISTS "Students can view published chapters" ON public.chapters;

CREATE POLICY "Students can view published chapters"
ON public.chapters FOR SELECT
USING (
  is_published = true
);

-- 3. Verification: Check if chapters are visible now
-- This query mimics what the student sees
SELECT id, title, is_published 
FROM public.chapters 
WHERE is_published = true 
LIMIT 5;
