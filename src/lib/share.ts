// Share Service - Native Share Functionality
// Share courses, achievements, and content

import { Share } from '@capacitor/share';

/**
 * Share manager for the app
 */
export const shareService = {
    /**
     * Share a course
     */
    async shareCourse(course: {
        id: string;
        title: string;
        description?: string;
    }) {
        try {
            await Share.share({
                title: `Check out: ${course.title}`,
                text: course.description || `I'm learning ${course.title} on ADH Connect!`,
                url: `https://adh.today/courses/${course.id}`,
                dialogTitle: 'Share Course',
            });
        } catch (error) {
            console.error('Failed to share course:', error);
        }
    },

    /**
     * Share achievement
     */
    async shareAchievement(achievement: string) {
        try {
            await Share.share({
                title: 'My Achievement!',
                text: `I just ${achievement} on ADH Connect! 🎉`,
                url: 'https://adh.today',
                dialogTitle: 'Share Achievement',
            });
        } catch (error) {
            console.error('Failed to share achievement:', error);
        }
    },

    /**
     * Share app download link
     */
    async shareApp() {
        try {
            await Share.share({
                title: 'Try ADH Connect',
                text: 'Join me on ADH Connect - The best platform for learning!',
                url: 'https://adh.today',
                dialogTitle: 'Share ADH Connect',
            });
        } catch (error) {
            console.error('Failed to share app:', error);
        }
    },

    /**
     * Share custom content
     */
    async shareContent(content: {
        title: string;
        text: string;
        url?: string;
    }) {
        try {
            await Share.share({
                title: content.title,
                text: content.text,
                url: content.url,
                dialogTitle: 'Share',
            });
        } catch (error) {
            console.error('Failed to share content:', error);
        }
    },

    /**
     * Check if sharing is available
     */
    async canShare(): Promise<boolean> {
        try {
            const result = await Share.canShare();
            return result.value;
        } catch {
            return false;
        }
    },
};

/**
 * React hook for sharing
 */
export function useShare() {
    return {
        shareCourse: shareService.shareCourse,
        shareAchievement: shareService.shareAchievement,
        shareApp: shareService.shareApp,
        shareContent: shareService.shareContent,
        canShare: shareService.canShare,
    };
}
