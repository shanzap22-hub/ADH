-- FIX: Ensure Attachments are Visible (SELECT Policy)
-- This ensures that uploaded attachments can be SEEN by the admin.

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

-- Drop existing select policies to avoid conflicts
drop policy if exists "Anyone can view attachments" on attachments;
drop policy if exists "Authenticated users can view attachments" on attachments;

-- Grant SELECT to everyone (or at least authenticated users)
-- Since course attachments are usually visible to students, this is safe.
create policy "Authenticated users can view attachments"
on attachments for select
using ( auth.role() = 'authenticated' );

-- Also ensure INSERT/DELETE policies are robust (Re-applying just in case)
drop policy if exists "Admins and Owners can insert attachments" on attachments;
create policy "Admins and Owners can insert attachments"
on attachments for insert
with check (
  is_admin() or
  auth.uid() in (select instructor_id from courses where id = attachments.course_id)
);

drop policy if exists "Admins and Owners can delete attachments" on attachments;
create policy "Admins and Owners can delete attachments"
on attachments for delete
using (
  is_admin() or
  auth.uid() in (select instructor_id from courses where id = attachments.course_id)
);
