-- Add column to track Google Sheet sync status
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_synced_to_sheet BOOLEAN DEFAULT FALSE;

-- Optional: Create index for faster filtering if table grows large
CREATE INDEX IF NOT EXISTS idx_transactions_synced 
ON public.transactions(is_synced_to_sheet);
