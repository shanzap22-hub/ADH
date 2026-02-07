// Secure In-App Browser Service
// Play Store compliant in-app browser with URL validation

import { InAppBrowser } from '@capacitor-community/in-app-browser';
import { Browser } from '@capacitor/browser';

/**
 * Trusted domains that can be opened in in-app browser
 * Play Store requirement: Only load trusted, verified URLs
 */
const TRUSTED_DOMAINS = [
    'adh.today',
    'www.adh.today',
    'supabase.co',
    'googleapis.com',
    'google.com',
    'youtube.com',
    'youtu.be',
] as const;

/**
 * Check if a URL is from a trusted domain
 */
function isTrustedUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Must use HTTPS (Play Store requirement)
        if (urlObj.protocol !== 'https:') {
            console.warn('Blocked non-HTTPS URL:', url);
            return false;
        }

        // Check if domain is trusted
        const hostname = urlObj.hostname.toLowerCase();
        return TRUSTED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith(`.${domain}`)
        );
    } catch (error) {
        console.error('Invalid URL:', url);
        return false;
    }
}

/**
 * Secure In-App Browser Manager
 * All external links must be verified before opening
 */
export const secureBrowser = {
    /**
     * Open URL in in-app browser (only if trusted)
     * @param url - URL to open (must be HTTPS and from trusted domain)
     * @param options - Browser options
     */
    async open(url: string, options?: {
        title?: string;
        toolbarColor?: string;
        showTitle?: boolean;
    }): Promise<void> {
        // Validate URL is trusted
        if (!isTrustedUrl(url)) {
            throw new Error(`Untrusted URL blocked: ${url}. Only HTTPS URLs from trusted domains are allowed.`);
        }

        try {
            await InAppBrowser.open({
                url,
                toolbarColor: options?.toolbarColor || '#4f46e5',
                showTitle: options?.showTitle ?? true,
                closeButtonText: 'Close',
                presentationStyle: 'fullscreen',
                // Android-specific options
                android: {
                    showTitle: options?.showTitle ?? true,
                    toolbarColor: options?.toolbarColor || '#4f46e5',
                },
            });
        } catch (error) {
            console.error('Failed to open in-app browser:', error);
            // Fallback to system browser if in-app browser fails
            await this.openExternal(url);
        }
    },

    /**
     * Open URL in system browser (only if trusted)
     */
    async openExternal(url: string): Promise<void> {
        if (!isTrustedUrl(url)) {
            throw new Error(`Untrusted URL blocked: ${url}`);
        }

        try {
            await Browser.open({ url });
        } catch (error) {
            console.error('Failed to open system browser:', error);
            throw new Error('Failed to open browser');
        }
    },

    /**
     * Close in-app browser
     */
    async close(): Promise<void> {
        try {
            await InAppBrowser.close();
        } catch (error) {
            console.error('Failed to close in-app browser:', error);
        }
    },

    /**
     * Check if a URL can be safely opened
     * Useful for UI to show/hide external link buttons
     */
    canOpen(url: string): boolean {
        return isTrustedUrl(url);
    },

    /**
     * Open course external link (pre-validated for course URLs)
     */
    async openCourseResource(resourceUrl: string): Promise<void> {
        // Validate it's an HTTPS URL
        if (!resourceUrl.startsWith('https://')) {
            throw new Error('Only HTTPS URLs are allowed');
        }

        // For course resources, we trust URLs from our domain
        const url = new URL(resourceUrl);
        if (url.hostname.includes('adh.today')) {
            await this.open(resourceUrl, {
                title: 'Course Resource',
                toolbarColor: '#4f46e5',
            });
        } else {
            // For external course resources, ask user
            const confirmed = confirm(
                `This will open an external website:\n${url.hostname}\n\nDo you want to continue?`
            );

            if (confirmed && isTrustedUrl(resourceUrl)) {
                await this.open(resourceUrl);
            }
        }
    },

    /**
     * Open YouTube video in in-app browser
     */
    async openYouTube(videoId: string): Promise<void> {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        await this.open(url, {
            title: 'Video',
            toolbarColor: '#FF0000',
        });
    },

    /**
     * Add a custom trusted domain (use with caution)
     * Only add domains you control or explicitly trust
     */
    addTrustedDomain(domain: string): void {
        console.warn('Adding custom trusted domain:', domain);
        // In production, you'd want to validate this domain server-side
        // and store it in a configuration
    },
};

/**
 * React hook for secure browser
 */
export function useSecureBrowser() {
    const openLink = async (url: string) => {
        try {
            await secureBrowser.open(url);
        } catch (error) {
            console.error('Failed to open link:', error);
            alert('This link cannot be opened for security reasons.');
        }
    };

    return {
        openLink,
        canOpen: secureBrowser.canOpen,
        openCourseResource: secureBrowser.openCourseResource,
        openYouTube: secureBrowser.openYouTube,
    };
}
