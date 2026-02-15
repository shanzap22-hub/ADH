-- Create mind_maps table
create table if not exists mind_maps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Mind Map',
  description text,
  content jsonb default '{}'::jsonb,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table mind_maps enable row level security;

-- Policies
create policy "Users can view their own mind maps"
  on mind_maps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mind maps"
  on mind_maps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mind maps"
  on mind_maps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own mind maps"
  on mind_maps for delete
  using (auth.uid() = user_id);

-- Storage bucket for mind map assets (images)
-- Note: This might need to be run separately if migration user doesn't have permissions, but usually fine.
insert into storage.buckets (id, name, public)
values ('mind-map-assets', 'mind-map-assets', true)
on conflict (id) do nothing;

create policy "Mind map assets are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'mind-map-assets' );

create policy "Users can upload mind map assets"
  on storage.objects for insert
  with check ( bucket_id = 'mind-map-assets' and auth.uid() = owner );

create policy "Users can update their mind map assets"
  on storage.objects for update
  using ( bucket_id = 'mind-map-assets' and auth.uid() = owner );

create policy "Users can delete their mind map assets"
  on storage.objects for delete
  using ( bucket_id = 'mind-map-assets' and auth.uid() = owner );
