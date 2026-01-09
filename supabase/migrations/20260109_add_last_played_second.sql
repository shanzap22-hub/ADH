-- Update User Progress Table to add last_played_second column
-- This is safe to run multiple times due to "if not exists" clause
alter table public.user_progress 
add column if not exists last_played_second integer default 0;
