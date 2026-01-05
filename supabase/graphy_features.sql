-- Graphy-style Features Database Tables
-- Run this SQL in your Supabase SQL Editor

-- 1. Chapter Q&A / Comments System
CREATE TABLE IF NOT EXISTS chapter_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES chapter_comments(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter ON chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user ON chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent ON chapter_comments(parent_comment_id);

-- 2. Chapter Attachments / Resources
CREATE TABLE IF NOT EXISTS chapter_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    file_type TEXT, -- pdf, zip, etc
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_attachments_chapter ON chapter_attachments(chapter_id);

-- 3. Course Reviews & Ratings
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, user_id) -- One review per user per course
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user ON course_reviews(user_id);

-- 4. Quiz System Tables
CREATE TABLE IF NOT EXISTS chapter_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    passing_score INTEGER DEFAULT 70,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chapter_id) -- One quiz per chapter
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES chapter_quizzes(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer INTEGER NOT NULL, -- Index of correct option (0-3)
    points INTEGER DEFAULT 1,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES chapter_quizzes(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB, -- Store user's answers
    completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- RLS Policies

-- Chapter Comments
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON chapter_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create comments"
ON chapter_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON chapter_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON chapter_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Chapter Attachments
ALTER TABLE chapter_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attachments"
ON chapter_attachments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Instructors can manage attachments"
ON chapter_attachments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chapters
        JOIN courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_attachments.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Course Reviews
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON course_reviews
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own reviews"
ON course_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON course_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON course_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Quiz Tables
ALTER TABLE chapter_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes"
ON chapter_quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view quiz questions"
ON quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own attempts"
ON quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts"
ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Instructors can manage quizzes
CREATE POLICY "Instructors can manage quizzes"
ON chapter_quizzes FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chapters
        JOIN courses ON courses.id = chapters.course_id
        WHERE chapters.id = chapter_quizzes.chapter_id
        AND courses.instructor_id = auth.uid()
    )
);

CREATE POLICY "Instructors can manage quiz questions"
ON quiz_questions FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chapter_quizzes
        JOIN chapters ON chapters.id = chapter_quizzes.chapter_id
        JOIN courses ON courses.id = chapters.course_id
        WHERE chapter_quizzes.id = quiz_questions.quiz_id
        AND courses.instructor_id = auth.uid()
    )
);
