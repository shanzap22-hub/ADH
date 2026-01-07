-- Check current RLS policies for courses table to see who can INSERT/UPDATE
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'courses'
AND cmd IN ('INSERT', 'UPDATE')
ORDER BY cmd, policyname;
