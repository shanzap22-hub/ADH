-- FIX: Handle Both 'admin' and 'super_admin' Roles
-- The main issue identified is that the system checks for role='admin',
-- but the seeding script set role='super_admin'. This mismatch causes permission denials.

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin') -- Allow BOTH roles
  );
end;
$$ language plpgsql security definer;

-- Re-apply policies to be absolutely sure they use the updated function
-- (Though just updating the function is usually enough, re-creating policies is safer if function signature changed)

-- Attachments SELECT Policy (Visibility)
drop policy if exists "Authenticated users can view attachments" on attachments;
create policy "Authenticated users can view attachments"
on attachments for select
using ( auth.role() = 'authenticated' );

-- Attachments INSERT Policy
drop policy if exists "Admins and Owners can insert attachments" on attachments;
create policy "Admins and Owners can insert attachments"
on attachments for insert
with check (
  is_admin() or -- Now supports super_admin
  auth.uid() in (select instructor_id from courses where id = attachments.course_id)
);

-- Attachments DELETE Policy
drop policy if exists "Admins and Owners can delete attachments" on attachments;
create policy "Admins and Owners can delete attachments"
on attachments for delete
using (
  is_admin() or -- Now supports super_admin
  auth.uid() in (select instructor_id from courses where id = attachments.course_id)
);

-- Chapters UPDATE Policy (Video Save)
drop policy if exists "Admins can update chapters" on chapters;
create policy "Admins can update chapters"
on chapters for update
using (
  is_admin() or 
  auth.uid() in (select instructor_id from courses where id = chapters.course_id)
);
