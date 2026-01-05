-- Graphy-style Features Database Tables (CORRECTED to match your schema)
-- Run this SQL in your Supabase SQL Editor

-- 1. Chapter Attachments / Resources
CREATE TABLE IF NOT EXISTS public.chapter_attachments (
    id uuid default uuid_generate_v4() primary key,
    chapter_id uuid references public.chapters(id) on delete cascade not null,
    name text not null,
    file_url text not null,
    file_size integer, -- in bytes
    file_type text, -- pdf, zip, etc
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_chapter_attachments_chapter ON public.chapter_attachments(chapter_id);

-- 2. Chapter Q&A / Comments System
CREATE TABLE IF NOT EXISTS public.chapter_comments (
    id uuid default uuid_generate_v4() primary key,
    chapter_id uuid references public.chapters(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    parent_comment_id uuid references public.chapter_comments(id) on delete cascade,
    question text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter ON public.chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user ON public.chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent ON public.chapter_comments(parent_comment_id);

-- 3. Course Reviews & Ratings
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references public.courses(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    rating integer check (rating >= 1 and rating <= 5) not null,
    review_text text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(course_id, user_id) -- One review per user per course
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user ON public.course_reviews(user_id);

-- 4. Quiz System Tables
CREATE TABLE IF NOT EXISTS public.chapter_quizzes (
    id uuid default uuid_generate_v4() primary key,
    chapter_id uuid references public.chapters(id) on delete cascade not null,
    title text not null,
    passing_score integer default 70,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(chapter_id) -- One quiz per chapter
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid default uuid_generate_v4() primary key,
    quiz_id uuid references public.chapter_quizzes(id) on delete cascade not null,
    question text not null,
    options jsonb not null, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer integer not null, -- Index of correct option (0-3)
    points integer default 1,
    position integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    quiz_id uuid references public.chapter_quizzes(id) on delete cascade not null,
    score integer not null,
    total_points integer not null,
    passed boolean not null,
    answers jsonb, -- Store user's answers
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Chapter Attachments RLS
ALTER TABLE public.chapter_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attachments"
ON public.chapter_attachments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Instructors can manage attachments for their courses"
ON public.chapter_attachments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Chapter Comments RLS
ALTER TABLE public.chapter_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.chapter_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create comments"
ON public.chapter_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.chapter_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.chapter_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Course Reviews RLS
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON public.course_reviews
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own reviews"
ON public.course_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.course_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.course_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Quiz RLS
ALTER TABLE public.chapter_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes"
ON public.chapter_quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view quiz questions"
ON public.quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own attempts"
ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts"
ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Instructors can manage quizzes for their courses
CREATE POLICY "Instructors can manage quizzes"
ON public.chapter_quizzes FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapters
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_quizzes.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

CREATE POLICY "Instructors can manage quiz questions"
ON public.quiz_questions FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapter_quizzes
        JOIN public.chapters ON chapters.id = chapter_quizzes.chapter_id
        JOIN public.courses ON courses.id = chapters.course_id
        WHERE chapter_quizzes.id = quiz_questions.quiz_id
        AND courses.instructor_id = auth.uid()
    )
);
