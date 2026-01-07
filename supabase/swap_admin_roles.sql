-- Swap roles: Make help.avodha@gmail.com a student and shanzap22@gmail.com a super admin

-- Current state:
-- help.avodha@gmail.com = super_admin (will become student)
-- shanzap22@gmail.com = student (will become super_admin)

-- Change help.avodha@gmail.com to student
UPDATE profiles
SET role = 'student', updated_at = NOW()
WHERE email = 'help.avodha@gmail.com';

-- Change shanzap22@gmail.com to super_admin
UPDATE profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'shanzap22@gmail.com';

-- Verify the changes
SELECT 
    email,
    full_name,
    role,
    updated_at
FROM profiles
WHERE email IN ('help.avodha@gmail.com', 'shanzap22@gmail.com')
ORDER BY role DESC;
