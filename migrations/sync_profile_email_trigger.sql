-- Create a function to sync profile email changes to auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email has changed
  IF NEW.email <> OLD.email THEN
    -- Update auth.users table
    UPDATE auth.users
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_profile_email_change ON public.profiles;
CREATE TRIGGER on_profile_email_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email_to_auth();
