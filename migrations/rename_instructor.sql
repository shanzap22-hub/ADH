-- Rename 'Shanza P' to 'ADH Instructor'
UPDATE profiles
SET full_name = 'ADH Instructor'
WHERE full_name ILIKE '%Shanza%';
