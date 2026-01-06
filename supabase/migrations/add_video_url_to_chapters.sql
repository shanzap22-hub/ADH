-- Add video_url column to chapters table
-- This was missing from the schema

ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS video_url TEXT;
