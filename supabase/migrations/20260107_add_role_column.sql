-- Migration: Update role column to support super_admin
-- The role column already exists, we just need to update the constraint

-- Step 1: Drop existing check constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add new check constraint with super_admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'instructor', 'admin', 'super_admin'));

-- Step 3: Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 4: Update 'admin' role to 'super_admin' if any exist
UPDATE profiles 
SET role = 'super_admin' 
WHERE role = 'admin';

-- Step 5: Add comment for documentation
COMMENT ON COLUMN profiles.role IS 'User role: student, instructor, admin, or super_admin';
