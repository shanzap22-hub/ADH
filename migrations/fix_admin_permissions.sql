-- POLICY FIX: Allow Admins to Manage Everything
-- This fixes the issue where a second admin (not owner) cannot edit chapters or attachments.

-- 1. Create a function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Update Policies for CHAPTERS
create policy "Admins can update chapters"
on chapters for update
using (
  is_admin() or 
  auth.uid() in (
    select instructor_id from courses where id = chapters.course_id
  )
);

create policy "Admins can insert chapters"
on chapters for insert
with check (
  is_admin() or 
  auth.uid() in (
    select instructor_id from courses where id = chapters.course_id
  )
);

-- 3. Update Policies for ATTACHMENTS
-- Drop existing policies first to be safe (overwriting logic)
drop policy if exists "Instructors can insert attachments" on attachments;
drop policy if exists "Instructors can delete own course attachments" on attachments;

create policy "Admins and Owners can insert attachments"
on attachments for insert
with check (
  is_admin() or
  auth.uid() in (
    select instructor_id from courses where id = attachments.course_id
  )
);

create policy "Admins and Owners can delete attachments"
on attachments for delete
using (
  is_admin() or
  auth.uid() in (
    select instructor_id from courses where id = attachments.course_id
  )
);

-- 4. Update Policies for MUX/VIDEO DATA (if stored in a separate table, but usually in chapters)
-- Check `mux_data` if exists, otherwise chapters handles video_url.

-- 5. Ensure Select is open or Admin-enabled
-- Currently attachments select is "true" (public), so that's fine.
