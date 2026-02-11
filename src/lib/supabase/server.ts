import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            global: {
                // FORCE NO-CACHE: Prevent Next.js Data Cache from serving stale DB results
                fetch: (url, options) => {
                    return fetch(url, { ...options, cache: 'no-store' });
                },
            },
        }
    )
}
