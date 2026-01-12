-- Allow instructors to insert posts
CREATE POLICY "Instructors can insert posts"
ON public.posts
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'instructor'
    )
);

-- Allow instructors to update their own posts
CREATE POLICY "Instructors can update own posts"
ON public.posts
FOR UPDATE
USING (
    author_id = auth.uid()
);

-- Allow instructors to delete their own posts
CREATE POLICY "Instructors can delete own posts"
ON public.posts
FOR DELETE
USING (
    author_id = auth.uid()
);

-- Allow instructors to insert post_tier_access
-- NOTE: Instructors need to be able to insert rows linked to their new posts.
-- We can't easily check "post.author_id" here on INSERT because the row doesn't exist yet/we are inserting it.
-- But we can check if the user is an instructor.
CREATE POLICY "Instructors can insert post_tier_access"
ON public.post_tier_access
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'instructor'
    )
);

-- Allow instructors to view all posts (for now, or maybe restrict? The request implies they are posting to the FEED, which implies they can see it)
-- The existing policy "Users can view posts matching their tier" might restrict instructors if they don't have a 'tier'.
-- Instructors usually don't have a membership tier.
-- So we need a policy for Instructors to view ALL posts (like Admins).

CREATE POLICY "Instructors can view all posts"
ON public.posts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'instructor'
    )
);
