-- Create posts table
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

-- Create post_tier_access table
CREATE TABLE IF NOT EXISTS public.post_tier_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tier TEXT NOT NULL
);

-- Enable RLS on post_tier_access
ALTER TABLE public.post_tier_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts

-- Admins can do everything
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

-- RLS Policies for post_tier_access

-- Admins can do everything
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

-- Users can read tier access (publicly available for reading to facilitate filtering)
CREATE POLICY "Users can read post_tier_access"
ON public.post_tier_access
FOR SELECT
USING (true);
