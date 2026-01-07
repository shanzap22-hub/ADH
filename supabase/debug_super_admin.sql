-- Debug script to check super admin setup
-- Run this to verify everything is configured correctly

-- 1. Check if role column exists and has correct values
SELECT 
    email,
    role,
    created_at
FROM profiles
WHERE email IN ('help.avodha@gmail.com', 'febaharis@gmail.com')
ORDER BY email;

-- 2. Check all courses and their owners
SELECT 
    c.id,
    c.title,
    c.is_published,
    c.instructor_id,
    p.email as instructor_email,
    p.role as instructor_role
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
ORDER BY c.created_at DESC;

-- 3. Check if RLS policies exist for super admin
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'courses'
AND policyname LIKE '%Super%'
ORDER BY policyname;

-- 4. Test query as if we're super admin
-- This simulates what the app should be doing
SELECT 
    id,
    title,
    instructor_id,
    is_published
FROM courses
ORDER BY created_at DESC;
