-- Create master_notes table
CREATE TABLE IF NOT EXISTS master_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_notes ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Instructors can CRUD their own notes
CREATE POLICY "Instructors can view their own notes"
ON master_notes FOR SELECT
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can insert their own notes"
ON master_notes FOR INSERT
WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own notes"
ON master_notes FOR UPDATE
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own notes"
ON master_notes FOR DELETE
USING (auth.uid() = instructor_id);

-- 2. Public (Students) can view published notes
-- Note: This allows ANYONE to view if is_published is true
CREATE POLICY "Public can view published notes"
ON master_notes FOR SELECT
USING (is_published = true);

-- Indexes for performance
CREATE INDEX idx_master_notes_instructor_id ON master_notes(instructor_id);
CREATE INDEX idx_master_notes_is_published ON master_notes(is_published);
