-- RLS Policy for Manual Student Enrollment
-- Copy and run this SQL in your Supabase SQL Editor

-- Step 1: First, check current policies (optional - for debugging)
-- SELECT * FROM pg_policies WHERE tablename = 'purchases';

-- Step 2: Drop existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Users can purchase courses" ON purchases;
DROP POLICY IF EXISTS "Instructors can manually enroll students" ON purchases;

-- Step 3: Create new policy that allows instructors/teachers to enroll students
CREATE POLICY "Instructors can enroll students in their courses"
ON purchases
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is instructor/teacher AND course belongs to them
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('instructor', 'teacher')
    )
    AND EXISTS (
        SELECT 1
        FROM courses
        WHERE courses.id = purchases.course_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Step 4: Also allow students to self-enroll (for payment flow)
CREATE POLICY "Users can self-enroll in courses"
ON purchases
FOR INSERT
TO authenticated
WITH CHECK (
    -- User can insert their own enrollment
    purchases.user_id = auth.uid()
);

-- Step 5: Allow users to view their own enrollments
CREATE POLICY "Users can view their own purchases"
ON purchases
FOR SELECT
TO authenticated
USING (
    purchases.user_id = auth.uid()
    OR
    -- Instructors can view enrollments for their courses
    EXISTS (
        SELECT 1
        FROM courses
        WHERE courses.id = purchases.course_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'purchases';
