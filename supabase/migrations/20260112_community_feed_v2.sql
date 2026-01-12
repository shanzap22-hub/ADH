-- Create posts table (if not exists)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_pinned BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create post_tier_access table (if not exists)
CREATE TABLE IF NOT EXISTS public.post_tier_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tier TEXT NOT NULL
);

-- Enable RLS on post_tier_access
ALTER TABLE public.post_tier_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent errors
DROP POLICY IF EXISTS "Admins can do everything with posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view posts matching their tier" ON public.posts;
DROP POLICY IF EXISTS "Admins can do everything with post_tier_access" ON public.post_tier_access;
DROP POLICY IF EXISTS "Users can read post_tier_access" ON public.post_tier_access;

-- Re-create Policies

-- Admins can do everything with posts
CREATE POLICY "Admins can do everything with posts"
ON public.posts
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Users can view posts matching their tier
CREATE POLICY "Users can view posts matching their tier"
ON public.posts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.post_tier_access pta
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE pta.post_id = posts.id
        AND pta.tier = p.membership_tier
    )
);

-- Admins can do everything with post_tier_access
CREATE POLICY "Admins can do everything with post_tier_access"
ON public.post_tier_access
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Users can read tier access
CREATE POLICY "Users can read post_tier_access"
ON public.post_tier_access
FOR SELECT
USING (true);
