-- Disables the trigger that automatically syncs profile changes to ALL transactions.
-- This ensures that transaction history is preserved (old transactions keep old numbers).
DROP TRIGGER IF EXISTS on_profile_update_sync_transactions ON profiles;
