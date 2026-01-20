-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Information captured at Checkout/Lead Stage (Drop-off tracking)
    whatsapp_number TEXT,
    email TEXT,
    student_name TEXT,
    
    -- Linked User (Optional, if logged in or mapped later)
    user_id UUID REFERENCES auth.users(id),
    
    -- Transaction Details
    amount NUMERIC,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed', 'refunded'
    source TEXT DEFAULT 'razorpay', -- 'razorpay', 'manual', 'gpay_direct'
    
    -- Razorpay References
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    
    -- Manual Entry Metadata
    notes TEXT,
    membership_plan TEXT -- 'silver', 'diamond', etc.
);

-- 2. Create Audit Log Table (History of Edits)
CREATE TABLE IF NOT EXISTS public.transaction_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id), -- Who made the change
    action TEXT, -- 'create', 'update'
    changes JSONB, -- Stores { old_amount: ..., new_amount: ... }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow public (Razorpay webhook/API) to insert?
-- Usually service role handles this. 
-- For Dashboard, allow Admins to view everything.

CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

CREATE POLICY "Admins can insert/update transactions" ON public.transactions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

CREATE POLICY "Admins can view audit logs" ON public.transaction_audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

-- 5. Realtime?
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
