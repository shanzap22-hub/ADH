-- Function to get User ID by Email (Securely)
-- This is required to handle cases where a user exists in Auth but has no profile
-- (e.g. they tried Google Login, got rejected, then paid)

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = extensions, public, auth
AS $$
BEGIN
  RETURN (SELECT id FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql;
