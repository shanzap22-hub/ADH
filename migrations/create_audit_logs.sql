CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing polices if any
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- We don't really need an INSERT policy if we use Service Role in API routes,
-- but if we want to allow authenticated users to potentially log actions (via server wrappers),
-- we usually stick to Service Role for logging to ensure integrity.
