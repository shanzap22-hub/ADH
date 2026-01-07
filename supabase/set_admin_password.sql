-- Set password for shanzap22@gmail.com (super admin)
-- This allows login with email/password instead of just Google

-- Update the user's password in auth.users table
-- Password will be: shanza@123

UPDATE auth.users
SET 
    encrypted_password = crypt('shanza@123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'shanzap22@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    updated_at
FROM auth.users
WHERE email = 'shanzap22@gmail.com';
