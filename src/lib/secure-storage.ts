// Secure Token Storage Service
// Play Store compliant secure storage for authentication tokens

import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

interface StorageKeys {
    AUTH_TOKEN: string;
    REFRESH_TOKEN: string;
    USER_ID: string;
    USER_EMAIL: string;
}

const KEYS: StorageKeys = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    USER_EMAIL: 'user_email',
};

/**
 * Secure Storage Manager for sensitive data
 * Uses Android Keystore for encryption (Play Store compliant)
 */
export const secureStorage = {
    /**
     * Save authentication token securely
     */
    async saveAuthToken(token: string): Promise<void> {
        try {
            await SecureStoragePlugin.set({
                key: KEYS.AUTH_TOKEN,
                value: token,
            });
        } catch (error) {
            console.error('Failed to save auth token:', error);
            throw new Error('Failed to securely store authentication token');
        }
    },

    /**
     * Get authentication token
     */
    async getAuthToken(): Promise<string | null> {
        try {
            const { value } = await SecureStoragePlugin.get({ key: KEYS.AUTH_TOKEN });
            return value;
        } catch (error) {
            // Key doesn't exist or error occurred
            return null;
        }
    },

    /**
     * Save refresh token securely
     */
    async saveRefreshToken(token: string): Promise<void> {
        try {
            await SecureStoragePlugin.set({
                key: KEYS.REFRESH_TOKEN,
                value: token,
            });
        } catch (error) {
            console.error('Failed to save refresh token:', error);
            throw new Error('Failed to securely store refresh token');
        }
    },

    /**
     * Get refresh token
     */
    async getRefreshToken(): Promise<string | null> {
        try {
            const { value } = await SecureStoragePlugin.get({ key: KEYS.REFRESH_TOKEN });
            return value;
        } catch (error) {
            return null;
        }
    },

    /**
     * Save user credentials securely
     */
    async saveUserCredentials(credentials: {
        userId: string;
        email: string;
        authToken: string;
        refreshToken?: string;
    }): Promise<void> {
        try {
            await SecureStoragePlugin.set({ key: KEYS.USER_ID, value: credentials.userId });
            await SecureStoragePlugin.set({ key: KEYS.USER_EMAIL, value: credentials.email });
            await SecureStoragePlugin.set({ key: KEYS.AUTH_TOKEN, value: credentials.authToken });

            if (credentials.refreshToken) {
                await SecureStoragePlugin.set({ key: KEYS.REFRESH_TOKEN, value: credentials.refreshToken });
            }
        } catch (error) {
            console.error('Failed to save user credentials:', error);
            throw new Error('Failed to securely store user credentials');
        }
    },

    /**
     * Get user credentials
     */
    async getUserCredentials(): Promise<{
        userId: string;
        email: string;
        authToken: string;
        refreshToken: string | null;
    } | null> {
        try {
            const userId = await SecureStoragePlugin.get({ key: KEYS.USER_ID });
            const email = await SecureStoragePlugin.get({ key: KEYS.USER_EMAIL });
            const authToken = await SecureStoragePlugin.get({ key: KEYS.AUTH_TOKEN });

            let refreshToken = null;
            try {
                const refresh = await SecureStoragePlugin.get({ key: KEYS.REFRESH_TOKEN });
                refreshToken = refresh.value;
            } catch {
                // Refresh token might not exist
            }

            return {
                userId: userId.value,
                email: email.value,
                authToken: authToken.value,
                refreshToken,
            };
        } catch (error) {
            return null;
        }
    },

    /**
     * Clear all stored credentials (logout)
     */
    async clearAll(): Promise<void> {
        try {
            await SecureStoragePlugin.remove({ key: KEYS.AUTH_TOKEN });
            await SecureStoragePlugin.remove({ key: KEYS.REFRESH_TOKEN });
            await SecureStoragePlugin.remove({ key: KEYS.USER_ID });
            await SecureStoragePlugin.remove({ key: KEYS.USER_EMAIL });
        } catch (error) {
            console.error('Failed to clear credentials:', error);
        }
    },

    /**
     * Check if user has stored credentials
     */
    async hasStoredCredentials(): Promise<boolean> {
        try {
            const authToken = await SecureStoragePlugin.get({ key: KEYS.AUTH_TOKEN });
            return !!authToken.value;
        } catch {
            return false;
        }
    },
};
