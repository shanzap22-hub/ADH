-- Migration: Add chapter_attachments table
-- Created: 2026-01-06

-- Create chapter_attachments table
CREATE TABLE IF NOT EXISTS public.chapter_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chapter_attachments_chapter 
ON public.chapter_attachments(chapter_id);

-- Enable RLS
ALTER TABLE public.chapter_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Attachments viewable if chapter is accessible
CREATE POLICY "Attachments viewable with chapter access"
ON public.chapter_attachments
FOR SELECT
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

-- Instructors can insert attachments for their chapters
CREATE POLICY "Instructors can insert attachments"
ON public.chapter_attachments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Instructors can delete attachments for their chapters
CREATE POLICY "Instructors can delete attachments"
ON public.chapter_attachments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);
