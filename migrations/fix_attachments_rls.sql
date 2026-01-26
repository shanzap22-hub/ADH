-- Create attachments table if it doesn't exist (fixes missing table issue)
create table if not exists attachments (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    url text not null,
    course_id uuid references courses(id) on delete cascade,
    chapter_id uuid references chapters(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table attachments enable row level security;

-- Policies

-- 1. Insert: Allow instructors (who own the course) to insert
drop policy if exists "Instructors can insert attachments" on attachments;
create policy "Instructors can insert attachments"
on attachments for insert
with check (
    auth.uid() in (
        select instructor_id from courses
        where id = attachments.course_id
    )
);

-- 2. Delete: Allow instructors (who own the course) to delete
drop policy if exists "Instructors can delete own course attachments" on attachments;
create policy "Instructors can delete own course attachments"
on attachments for delete
using (
    auth.uid() in (
        select instructor_id from courses
        where id = attachments.course_id
    )
);

-- 3. Select: Allow everyone (or at least enrolled students) to see
-- For simplicity, public visibility if they have the link/access to course page
drop policy if exists "Everyone can view attachments" on attachments;
create policy "Everyone can view attachments"
on attachments for select
using (true);
