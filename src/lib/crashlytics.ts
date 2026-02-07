// Crashlytics Service - Production Error Tracking
// Automatically reports crashes and errors to Firebase

import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

/**
 * Initialize Crashlytics with user context
 */
export const crashlytics = {
    /**
     * Initialize crashlytics for the current user
     */
    async initialize(userId?: string, email?: string) {
        try {
            // Enable crashlytics
            await FirebaseCrashlytics.setEnabled({ enabled: true });

            // Set user identifier
            if (userId) {
                await FirebaseCrashlytics.setUserId({ userId });
            }

            // Set custom keys for debugging
            if (email) {
                await FirebaseCrashlytics.setCustomKey({
                    key: 'user_email',
                    value: email,
                    type: 'string',
                });
            }

            console.log('Crashlytics initialized successfully');
        } catch (error) {
            console.error('Failed to initialize crashlytics:', error);
        }
    },

    /**
     * Log a custom error
     */
    async logError(error: Error, context?: Record<string, any>) {
        try {
            // Add context as custom keys
            if (context) {
                for (const [key, value] of Object.entries(context)) {
                    await FirebaseCrashlytics.setCustomKey({
                        key,
                        value: String(value),
                        type: 'string',
                    });
                }
            }

            // Record the error
            await FirebaseCrashlytics.recordException({
                message: error.message,
                stacktrace: error.stack || '',
            });
        } catch (err) {
            console.error('Failed to log error to crashlytics:', err);
        }
    },

    /**
     * Log a custom message
     */
    async log(message: string) {
        try {
            await FirebaseCrashlytics.log({ message });
        } catch (error) {
            console.error('Failed to log message:', error);
        }
    },

    /**
     * Set custom key-value for debugging
     */
    async setCustomKey(key: string, value: string | number | boolean) {
        try {
            await FirebaseCrashlytics.setCustomKey({
                key,
                value: String(value),
                type: typeof value === 'number' ? 'long' : typeof value === 'boolean' ? 'boolean' : 'string',
            });
        } catch (error) {
            console.error('Failed to set custom key:', error);
        }
    },

    /**
     * Test crash (only use in development!)
     */
    async testCrash() {
        if (process.env.NODE_ENV === 'development') {
            await FirebaseCrashlytics.crash({ message: 'Test crash from development' });
        }
    },
};

/**
 * Global error handler - automatically report unhandled errors
 */
export function setupGlobalErrorHandler() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        crashlytics.logError(
            new Error(`Unhandled Promise Rejection: ${event.reason}`),
            { type: 'unhandledRejection' }
        );
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
        crashlytics.logError(event.error, {
            type: 'globalError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });
}
