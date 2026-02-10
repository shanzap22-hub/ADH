import { createBrowserClient } from '@supabase/ssr';
import { Capacitor } from '@capacitor/core';
import { createCapacitorStorage } from './capacitor-storage';

console.log('[DEBUG] client.ts loaded!');

export function createClient() {
    console.log('[DEBUG] createClient() called');
    console.log('[DEBUG] Capacitor available?', typeof Capacitor);
    console.log('[DEBUG] Capacitor.isNativePlatform?', typeof Capacitor.isNativePlatform);

    const isNative = Capacitor.isNativePlatform();
    console.log('[DEBUG] isNativePlatform() result:', isNative);

    // Mobile: Use custom secure storage adapter for session persistence
    if (isNative) {
        console.log('[Supabase] ✅ Initializing with Capacitor storage (MOBILE)');
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
            {
                auth: {
                    storage: createCapacitorStorage(),
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false, // Mobile doesn't need URL session detection
                },
            }
        );
    }

    // Browser: Keep default behavior (cookies-based, zero changes)
    console.log('[Supabase] ⚠️ Initializing with default storage (BROWSER)');
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
    );
}
