-- Fix: Set febaharis as instructor so their course ownership makes sense
UPDATE profiles 
SET role = 'instructor' 
WHERE email = 'febaharis@gmail.com';

-- Verify both users now have correct roles
SELECT 
    email,
    role,
    id
FROM profiles
WHERE email IN ('help.avodha@gmail.com', 'febaharis@gmail.com')
ORDER BY email;

-- Now verify super admin can see ALL courses
-- (This should return 2 courses when queried by super admin)
SELECT 
    c.title,
    c.instructor_id,
    p.email as instructor_email,
    p.role as instructor_role,
    c.is_published
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
ORDER BY c.title;
