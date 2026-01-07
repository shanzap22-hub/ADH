-- Quick script to create super admin user
-- Run this after the migrations are applied

-- Update the instructor account to be super admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'help.avodha@gmail.com';

-- Verify the update
SELECT id, email, role 
FROM profiles 
WHERE email = 'help.avodha@gmail.com';
