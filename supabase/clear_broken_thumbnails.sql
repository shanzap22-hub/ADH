-- Clear all broken thumbnail URLs so instructors can re-upload
UPDATE courses 
SET image_url = NULL 
WHERE image_url LIKE '%supabase.co/storage%'
AND image_url IS NOT NULL;

-- Verify the update
SELECT id, title, image_url 
FROM courses 
ORDER BY created_at DESC;
