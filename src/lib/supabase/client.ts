import { createBrowserClient } from '@supabase/ssr';
import { Capacitor } from '@capacitor/core';
import { createCapacitorStorage } from './capacitor-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton client instance
let supabaseClient: SupabaseClient | null = null;

export function createClient() {
    // Return existing client if already initialized
    if (supabaseClient) {
        return supabaseClient;
    }

    console.log('[DEBUG] Creating NEW Supabase client (first time)');

    const isNative = Capacitor.isNativePlatform();
    console.log('[DEBUG] isNativePlatform() result:', isNative);

    // Mobile: Use custom secure storage adapter for session persistence
    if (isNative) {
        console.log('[Supabase] ✅ Initializing with Capacitor storage (MOBILE)');
        supabaseClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
            {
                auth: {
                    storage: createCapacitorStorage(),
                    autoRefreshToken: true,
                    persistSession: true,

                    detectSessionInUrl: false, // Mobile doesn't need URL session detection
                },
                global: {
                    // FORCE NO-CACHE FOR MOBILE: Prevent WebView from serving stale data
                    fetch: (url, options) => {
                        return fetch(url, { ...options, cache: 'no-store' });
                    },
                },
            }
        );
    } else {
        // Browser: Keep default behavior (cookies-based, zero changes)
        console.log('[Supabase] ⚠️ Initializing with default storage (BROWSER)');
        supabaseClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
        );
    }

    return supabaseClient;
}
