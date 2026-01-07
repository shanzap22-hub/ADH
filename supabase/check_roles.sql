-- Check user roles and IDs
SELECT 
    id,
    email,
    role,
    full_name
FROM profiles
WHERE email IN ('help.avodha@gmail.com', 'febaharis@gmail.com')
ORDER BY email;

-- Check which user owns which course
SELECT 
    c.title,
    c.instructor_id,
    p.email as instructor_email,
    p.role as instructor_role
FROM courses c
LEFT JOIN profiles p ON c.instructor_id = p.id
ORDER BY c.title;
