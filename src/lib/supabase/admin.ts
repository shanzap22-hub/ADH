import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
