-- Create course-attachments bucket if not exists
insert into storage.buckets (id, name, public)
values ('course-attachments', 'course-attachments', true)
on conflict (id) do nothing;

-- Policy to allow authenticated uploads to course-attachments
create policy "Authenticated Insert Attachments"
  on storage.objects for insert
  with check ( bucket_id = 'course-attachments' and auth.role() = 'authenticated' );

-- Policy to allow owner to delete their own attachments
create policy "Owner Delete Attachments"
  on storage.objects for delete
  using ( bucket_id = 'course-attachments' and auth.uid() = owner );

-- Policy to allow public access to view attachments
create policy "Public Access Attachments"
  on storage.objects for select
  using ( bucket_id = 'course-attachments' );
