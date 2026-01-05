-- Create Storage Buckets
insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true);

insert into storage.buckets (id, name, public)
values ('chapter-videos', 'chapter-videos', true);

-- Policy: course-thumbnails
-- Public Read
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'course-thumbnails' );

-- Auth Upload (Instructors)
-- Assuming we just check for authenticated user for now, or stricter 'courses' check
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'course-thumbnails' );

-- Auth Update/Delete
create policy "Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'course-thumbnails' );

create policy "Authenticated Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'course-thumbnails' );


-- Policy: chapter-videos
-- Public Read (for MVP simplicity)
create policy "Public Access Videos"
  on storage.objects for select
  using ( bucket_id = 'chapter-videos' );

-- Auth Upload
create policy "Authenticated Upload Videos"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chapter-videos' );

-- Auth Update/Delete
create policy "Authenticated Update Videos"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'chapter-videos' );

create policy "Authenticated Delete Videos"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'chapter-videos' );
