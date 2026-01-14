create table if not exists public.mentorship_bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  meet_link text,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.mentorship_bookings enable row level security;

-- Policies
create policy "Users can view their own bookings"
  on public.mentorship_bookings for select
  using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.mentorship_bookings for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all bookings"
  on public.mentorship_bookings for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin', 'instructor')
    )
  );

create policy "Admins can update bookings"
  on public.mentorship_bookings for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin', 'instructor')
    )
  );
