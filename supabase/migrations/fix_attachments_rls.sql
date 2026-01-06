-- Fix RLS policy for viewing chapter attachments
-- The current policy only allows viewing if chapter is published
-- Instructors should be able to see attachments for their own courses

DROP POLICY IF EXISTS "Attachments viewable with chapter access" ON public.chapter_attachments;
DROP POLICY IF EXISTS "Anyone can view attachments" ON public.chapter_attachments;

-- New policy: Instructors can view attachments for their courses
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

-- Students can view attachments if chapter is published and accessible
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
