-- ADH CONNECT: Database Migration for Course->Chapter->Unit Hierarchy
-- This migration adds a Units table for individual lessons with videos

-- CREATE UNITS TABLE
-- Units are the individual lessons/videos within a chapter
create table if not exists public.units (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  bunny_video_id text, -- For Bunny.net hosted videos (format: bunny://VIDEO_ID)
  resources jsonb default '[]'::jsonb, -- Array of resource links/files
  position integer not null,
  is_free_preview boolean default false,
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ADD thumbnail_url TO CHAPTERS
-- Chapters now become containers/modules, so they need thumbnails
alter table public.chapters add column if not exists thumbnail_url text;

-- MIGRATE existing chapter video_urls to units (if any chapters have videos)
-- This creates one unit per chapter with existing video
INSERT INTO public.units (chapter_id, title, description, video_url, position, is_free_preview)
SELECT 
    id as chapter_id,
    title || ' - Lesson 1' as title,
    description,
    video_url,
    1 as position,
    is_free as is_free_preview
FROM public.chapters
WHERE video_url IS NOT NULL AND video_url != '';

-- REMOVE video_url from chapters (chapters are now just containers)
alter table public.chapters drop column if exists video_url;

-- UPDATE USER_PROGRESS TABLE to track units instead of chapters
-- Add unit_id column
alter table public.user_progress add column if not exists unit_id uuid references public.units(id) on delete cascade;

-- Make either chapter_id OR unit_id required (but we'll primarily use unit_id going forward)
-- Note: existing progress tracking remains on chapter_id for backward compatibility

-- CREATE INDEX for better query performance
create index if not exists idx_units_chapter_id on public.units(chapter_id);
create index if not exists idx_units_position on public.units(position);
create index if not exists idx_user_progress_unit_id on public.user_progress(unit_id);

-- RLS POLICIES FOR UNITS
alter table public.units enable row level security;

-- Units are viewable if the parent chapter is accessible
create policy "Units viewable if chapter is accessible"
  on public.units for select
  using (
    exists (
      select 1 from public.chapters
      join public.courses on courses.id = chapters.course_id
      where chapters.id = units.chapter_id
        and chapters.is_published = true
        and courses.is_published = true
        and (
          -- Free preview units
          units.is_free_preview = true
          or
          -- Or user has purchased the course
          exists (
            select 1 from public.purchases
            where user_id = auth.uid() and course_id = courses.id
          )
        )
    )
  );

-- Instructors can manage units for their courses
create policy "Instructors can insert units for their chapters"
  on public.units for insert
  with check (
    exists (
      select 1 from public.chapters
      join public.courses on courses.id = chapters.course_id
      where chapters.id = units.chapter_id 
        and courses.instructor_id = auth.uid()
    )
  );

create policy "Instructors can update units for their chapters"
  on public.units for update
  using (
    exists (
      select 1 from public.chapters
      join public.courses on courses.id = chapters.course_id
      where chapters.id = units.chapter_id 
        and courses.instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete units for their chapters"
  on public.units for delete
  using (
    exists (
      select 1 from public.chapters
      join public.courses on courses.id = chapters.course_id
      where chapters.id = units.chapter_id 
        and courses.instructor_id = auth.uid()
    )
  );

-- VERIFICATION QUERIES (Run after migration to verify)
-- Check units table
-- SELECT * FROM public.units LIMIT 5;

-- Check chapters table structure
-- SELECT id, title, thumbnail_url FROM public.chapters LIMIT 5;

-- Check migrated data
-- SELECT 
--   c.title as chapter_title,
--   (SELECT COUNT(*) FROM public.units WHERE chapter_id = c.id) as unit_count
-- FROM public.chapters c
-- LIMIT 10;
