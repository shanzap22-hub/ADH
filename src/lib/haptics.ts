// Haptic Feedback Service - Enhanced User Experience
// Provides tactile feedback for user interactions

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic feedback manager
 */
export const haptics = {
    /**
     * Light impact - for subtle interactions
     * Use for: button taps, list item selections
     */
    async light() {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
            // Haptics not available on this device
        }
    },

    /**
     * Medium impact - for standard interactions
     * Use for: submissions, confirmations
     */
    async medium() {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Heavy impact - for important interactions
     * Use for: errors, deletions, critical actions
     */
    async heavy() {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Success haptic - for successful actions
     * Use for: completed purchases, finished courses
     */
    async success() {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Warning haptic - for warnings
     * Use for: form validation errors, warnings
     */
    async warning() {
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Error haptic - for errors
     * Use for: failed actions, critical errors
     */
    async error() {
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Selection changed - for picker/selector changes
     */
    async selectionChanged() {
        try {
            await Haptics.selectionChanged();
        } catch (error) {
            // Haptics not available
        }
    },

    /**
     * Vibrate for a specific duration (Android only)
     */
    async vibrate(duration: number = 100) {
        try {
            await Haptics.vibrate({ duration });
        } catch (error) {
            // Haptics not available
        }
    },
};

/**
 * React hook for haptics
 */
export function useHaptics() {
    return haptics;
}

/**
 * Common haptic patterns for specific actions
 */
export const hapticPatterns = {
    buttonClick: () => haptics.light(),
    formSubmit: () => haptics.medium(),
    delete: () => haptics.heavy(),
    purchaseSuccess: () => haptics.success(),
    formError: () => haptics.warning(),
    actionFailed: () => haptics.error(),
    tabChange: () => haptics.selectionChanged(),
    longPress: () => haptics.medium(),
};
