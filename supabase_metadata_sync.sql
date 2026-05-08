-- This SQL script sets up a trigger to automatically sync user roles and membership tiers
-- from the 'public.profiles' table to the 'auth.users' app_metadata.
-- This allows the middleware to check roles instantly without querying the database.

-- 1. Create the function that updates auth.users metadata
CREATE OR REPLACE FUNCTION public.handle_profile_update_sync_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the metadata in auth.users
  UPDATE auth.users
  SET raw_app_metadata = 
    coalesce(raw_app_metadata, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role, 'membership_tier', NEW.membership_tier)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on public.profiles
DROP TRIGGER IF EXISTS on_profile_update_sync_metadata ON public.profiles;
CREATE TRIGGER on_profile_update_sync_metadata
  AFTER INSERT OR UPDATE OF role, membership_tier ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update_sync_metadata();

-- 3. Run a one-time sync for existing users
-- WARNING: This will update all users in auth.users based on their profile
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role, membership_tier FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_metadata = 
      coalesce(raw_app_metadata, '{}'::jsonb) || 
      jsonb_build_object('role', r.role, 'membership_tier', r.membership_tier)
    WHERE id = r.id;
  END LOOP;
END $$;
