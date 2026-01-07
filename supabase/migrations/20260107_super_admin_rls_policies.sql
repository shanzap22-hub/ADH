-- Migration: Add RLS policies for super admin access
-- Super admins can view, edit, and delete ALL courses regardless of ownership

-- ============================================
-- COURSES TABLE POLICIES
-- ============================================

-- Policy: Super admins can view all courses
DROP POLICY IF EXISTS "Super admins can view all courses" ON courses;
CREATE POLICY "Super admins can view all courses"
ON courses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Policy: Super admins can insert courses
DROP POLICY IF EXISTS "Super admins can insert courses" ON courses;
CREATE POLICY "Super admins can insert courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'super_admin' OR profiles.role = 'instructor')
  )
);

-- Policy: Super admins can update all courses
DROP POLICY IF EXISTS "Super admins can update all courses" ON courses;
CREATE POLICY "Super admins can update all courses"
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Policy: Super admins can delete all courses
DROP POLICY IF EXISTS "Super admins can delete all courses" ON courses;
CREATE POLICY "Super admins can delete all courses"
ON courses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- ============================================
-- CHAPTERS TABLE POLICIES
-- ============================================

-- Policy: Super admins can view all chapters
DROP POLICY IF EXISTS "Super admins can view all chapters" ON chapters;
CREATE POLICY "Super admins can view all chapters"
ON chapters FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Policy: Super admins can update all chapters
DROP POLICY IF EXISTS "Super admins can update all chapters" ON chapters;
CREATE POLICY "Super admins can update all chapters"
ON chapters FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Policy: Super admins can delete all chapters
DROP POLICY IF EXISTS "Super admins can delete all chapters" ON chapters;
CREATE POLICY "Super admins can delete all chapters"
ON chapters FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- ============================================
-- PROFILES TABLE POLICIES (User Management)
-- ============================================

-- Policy: Super admins can view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- Policy: Super admins can update all profiles (role assignment)
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
CREATE POLICY "Super admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- ============================================
-- AUDIT LOG TABLE (Optional - for tracking admin actions)
-- ============================================

-- Create audit log table for super admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- RLS for audit log (only super admins can view)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit log" ON admin_audit_log;
CREATE POLICY "Super admins can view audit log"
ON admin_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Add comment
COMMENT ON TABLE admin_audit_log IS 'Audit log for super admin actions';
