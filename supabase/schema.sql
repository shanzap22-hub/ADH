-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text check (role in ('student', 'instructor', 'admin')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- COURSES TABLE
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  price decimal(10, 2) default 0,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Courses
alter table public.courses enable row level security;

create policy "Published courses are viewable by everyone."
  on public.courses for select
  using ( is_published = true );

create policy "Instructors can insert courses."
  on public.courses for insert
  with check ( auth.uid() = instructor_id );

create policy "Instructors can update own courses."
  on public.courses for update
  using ( auth.uid() = instructor_id );

create policy "Instructors can delete own courses."
  on public.courses for delete
  using ( auth.uid() = instructor_id );


-- CHAPTERS TABLE
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  position integer not null,
  is_published boolean default false,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Chapters
alter table public.chapters enable row level security;

create policy "Chapters are viewable by everyone if course is published and chapter is free."
  on public.chapters for select
  using ( 
    is_published = true 
    and 
    exists (
      select 1 from public.courses
      where id = chapters.course_id and is_published = true
    )
    and is_free = true
  );

-- TODO: Add policy for enrolled students to view paid chapters

create policy "Instructors can insert chapters for their courses."
  on public.chapters for insert
  with check ( 
    exists (
      select 1 from public.courses
      where id = chapters.course_id and instructor_id = auth.uid()
    )
  );

create policy "Instructors can update chapters for their courses."
  on public.chapters for update
  using ( 
    exists (
      select 1 from public.courses
      where id = chapters.course_id and instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete chapters for their courses."
  on public.chapters for delete
  using ( 
    exists (
      select 1 from public.courses
      where id = chapters.course_id and instructor_id = auth.uid()
    )
  );

-- PURCHASES TABLE
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- RLS for Purchases
alter table public.purchases enable row level security;

create policy "Users can view own purchases."
  on public.purchases for select
  using ( auth.uid() = user_id );

create policy "Users can insert own purchases."
  on public.purchases for insert
  with check ( auth.uid() = user_id );

-- USER PROGRESS TABLE
create table public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, chapter_id)
);

-- RLS for User Progress
alter table public.user_progress enable row level security;

create policy "Users can view own progress."
  on public.user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can update own progress."
  on public.user_progress for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own progress records."
  on public.user_progress for update
  using ( auth.uid() = user_id );

-- Updated Policy for Chapters: View if published+free OR purchased
drop policy "Chapters are viewable by everyone if course is published and chapter is free." on public.chapters;

create policy "Chapters viewable by everyone if free, or by purchaser"
  on public.chapters for select
  using (
    is_published = true
    and (
      is_free = true
      or exists (
        select 1 from public.purchases
        where user_id = auth.uid() and course_id = chapters.course_id
      )
    )
  );
