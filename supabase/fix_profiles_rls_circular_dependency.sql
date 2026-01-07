-- Fix circular dependency in profiles RLS policies
-- The "Super admins can view all profiles" policy causes a 500 error because:
-- 1. It tries to check if user.role = 'super_admin'
-- 2. To check the role, it needs to SELECT from profiles
-- 3. But to SELECT from profiles, it needs to check if they're super_admin
-- 4. This creates an infinite loop!

-- Solution: Drop the redundant super admin SELECT policy
-- The "Public profiles are viewable by everyone" policy (qual = true) 
-- already allows all users to SELECT profiles, so we don't need a separate super admin policy

DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Verify the remaining policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
