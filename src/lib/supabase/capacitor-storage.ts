import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

/**
 * Custom Supabase storage adapter for Capacitor
 * Uses SecureStoragePlugin for native platforms (Android/iOS)
 * Falls back to localStorage for web browsers
 * 
 * This fixes session persistence in mobile apps where cookies
 * don't persist across page navigations.
 */
export const createCapacitorStorage = () => {
    const isNative = Capacitor.isNativePlatform();

    return {
        /**
         * Get item from storage
         * @param key Storage key
         * @returns Stored value or null
         */
        async getItem(key: string): Promise<string | null> {
            if (!isNative) {
                // Web: Use standard localStorage
                return localStorage.getItem(key);
            }

            // Mobile: Use secure storage
            try {
                const { value } = await SecureStoragePlugin.get({ key });
                return value;
            } catch (error) {
                // Key doesn't exist or error occurred
                console.debug(`[CapacitorStorage] Failed to get ${key}:`, error);
                return null;
            }
        },

        /**
         * Set item in storage
         * @param key Storage key
         * @param value Value to store
         */
        async setItem(key: string, value: string): Promise<void> {
            if (!isNative) {
                // Web: Use standard localStorage
                localStorage.setItem(key, value);
                return;
            }

            // Mobile: Use secure storage
            try {
                await SecureStoragePlugin.set({ key, value });
                console.debug(`[CapacitorStorage] Saved ${key}`);

                // CRITICAL FIX: Sync to document.cookie for Middleware/Server visibility
                // Calculate expiry (default to 1 year or parse from session if possible)
                // Since this is just the raw JSON string, we set it as a cookie.
                // Note: Cookies have size limits. If token is too large this might fail, 
                // but for standard sessions it should be ok.
                // We set 'path=/' and 'SameSite=Lax' to ensure it's sent.
                document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax; Secure`;
            } catch (error) {
                console.error(`[CapacitorStorage] Failed to set ${key}:`, error);
                throw error;
            }
        },

        /**
         * Remove item from storage
         * @param key Storage key to remove
         */
        async removeItem(key: string): Promise<void> {
            if (!isNative) {
                // Web: Use standard localStorage
                localStorage.removeItem(key);
                return;
            }

            // Mobile: Use secure storage
            try {
                await SecureStoragePlugin.remove({ key });
                console.debug(`[CapacitorStorage] Removed ${key}`);

                // CRITICAL FIX: Remove from document.cookie
                document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
            } catch (error) {
                // Key might not exist, ignore error
                console.debug(`[CapacitorStorage] Failed to remove ${key}:`, error);
            }
        },
    };
};
