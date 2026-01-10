-- Create Attachments Table
create table if not exists public.attachments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  url text not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.attachments enable row level security;

-- Policies for Attachments
drop policy if exists "Attachments are viewable by everyone if course is published" on public.attachments;
create policy "Attachments are viewable by everyone if course is published"
  on public.attachments for select
  using ( 
    exists (
      select 1 from public.courses
      where id = attachments.course_id and is_published = true
    )
  );

drop policy if exists "Instructors can insert attachments" on public.attachments;
create policy "Instructors can insert attachments"
  on public.attachments for insert
  with check ( 
    exists (
      select 1 from public.courses
      where id = attachments.course_id and instructor_id = auth.uid()
    )
  );

drop policy if exists "Instructors can delete attachments" on public.attachments;
create policy "Instructors can delete attachments"
  on public.attachments for delete
  using ( 
    exists (
      select 1 from public.courses
      where id = attachments.course_id and instructor_id = auth.uid()
    )
  );

-- Update User Progress Table
alter table public.user_progress 
add column if not exists last_played_second integer default 0;
