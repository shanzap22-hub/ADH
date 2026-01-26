-- Disable automatic profile creation trigger
-- This prevents profiles from being auto-created on Google OAuth signup
-- Profiles will now only be created via:
-- 1. Payment success (/api/enrollment/finalize)
-- 2. Instructor manual enrollment

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify trigger is removed
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Should return 0 rows
