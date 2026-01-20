-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' (Rupees) or 'percentage' (%)
    discount_value NUMERIC NOT NULL,
    active BOOLEAN DEFAULT true,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    min_order_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add columns to Transactions table to track coupon usage
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC; 
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- 3. Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. Admin Access Policy
CREATE POLICY "Admins full access to coupons" ON public.coupons
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

-- 5. Create some sample coupons for Testing
INSERT INTO public.coupons (code, discount_type, discount_value, active)
VALUES 
    ('ADH100', 'fixed', 100, true),
    ('WELCOME500', 'fixed', 500, true),
    ('OFFER20', 'percentage', 20, true)
ON CONFLICT (code) DO NOTHING;
