-- Add end_time column to weekly_live_sessions table
alter table weekly_live_sessions add column if not exists end_time timestamp with time zone;
