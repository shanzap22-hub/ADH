-- ============================================
-- MASTER SCHEMA SYNC MIGRATION
-- Fixes all database schema mismatches
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO CHAPTERS
-- ============================================

-- Add video_url if missing
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add thumbnail for future use
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ============================================
-- 2. ENSURE CHAPTER_ATTACHMENTS TABLE EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.chapter_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapter_attachments_chapter 
ON public.chapter_attachments(chapter_id);

-- Enable RLS
ALTER TABLE public.chapter_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. FIX RLS POLICIES - CRITICAL
-- ============================================

-- DROP old restrictive policies
DROP POLICY IF EXISTS "Attachments viewable with chapter access" ON public.chapter_attachments;
DROP POLICY IF EXISTS "Anyone can view attachments" ON public.chapter_attachments;
DROP POLICY IF EXISTS "Instructors can manage attachments for their courses" ON public.chapter_attachments;

-- CHAPTERS: Add instructor view policy
-- This is CRITICAL - instructors need to see their own unpublished chapters!
CREATE POLICY IF NOT EXISTS "Instructors can view own chapters"
ON public.chapters FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = chapters.course_id
        AND instructor_id = auth.uid()
    )
);

-- ATTACHMENTS: Instructors can view attachments for their courses
CREATE POLICY "Instructors can view own course attachments"
ON public.chapter_attachments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- ATTACHMENTS: Students can view published chapter attachments
CREATE POLICY "Students can view published attachments"
ON public.chapter_attachments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        WHERE chapters.id = chapter_attachments.chapter_id
        AND chapters.is_published = true
        AND (
            chapters.is_free = true
            OR EXISTS (
                SELECT 1 FROM public.purchases
                WHERE user_id = auth.uid() 
                AND course_id = chapters.course_id
            )
        )
    )
);

-- ATTACHMENTS: Instructors can insert attachments
CREATE POLICY "Instructors can insert attachments"
ON public.chapter_attachments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- ATTACHMENTS: Instructors can delete attachments
CREATE POLICY "Instructors can delete attachments"
ON public.chapter_attachments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- ============================================
-- 4. ADD INSTRUCTOR POLICY FOR COURSES
-- ============================================

-- Instructors need to see their own unpublished courses
CREATE POLICY IF NOT EXISTS "Instructors can view own courses"
ON public.courses FOR SELECT
USING (
    instructor_id = auth.uid()
);

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check if video_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chapters' 
AND column_name = 'video_url';

-- Check chapter_attachments table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'chapter_attachments';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('chapters', 'chapter_attachments', 'courses')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If all queries above return results, schema is synced!
-- You can now use the LMS without schema errors.
