-- Create redirects table
create table if not exists public.redirects (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  destination text not null,
  clicks integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.redirects enable row level security;

-- Policies
create policy "Public can view redirects"
  on public.redirects for select
  using (true);

create policy "Admins can insert redirects"
  on public.redirects for insert
  with check (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

create policy "Admins can update redirects"
  on public.redirects for update
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

create policy "Admins can delete redirects"
  on public.redirects for delete
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- Indexes
create index if not exists redirects_slug_idx on public.redirects (slug);
