"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import { ModernLoader } from "@/components/ui/modern-loader";

export const SplashScreenProvider = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const initSplash = async () => {
            const isMobile = Capacitor.isNativePlatform();

            // 1. Wait for complete DOM load
            const domLoadPromise = new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    resolve(true);
                } else {
                    window.addEventListener('load', () => resolve(true));
                    // Fallback timeout after 10 seconds
                    setTimeout(() => resolve(true), 10000);
                }
            });

            await domLoadPromise;

            // 2. Wait for fonts to load (critical for preventing layout shift)
            try {
                await document.fonts.ready;
            } catch (e) {
                console.warn("Fonts API not supported", e);
            }

            // 3. Wait for Next.js to hydrate (check for Next.js readiness)
            const hydrationPromise = new Promise((resolve) => {
                // Check if React has hydrated by looking for interactive elements
                const checkHydration = () => {
                    // If we can find interactive elements, the app is likely hydrated
                    const hasInteractiveElements = document.querySelectorAll('button, a, input').length > 0;
                    if (hasInteractiveElements) {
                        resolve(true);
                    } else {
                        requestAnimationFrame(checkHydration);
                    }
                };
                checkHydration();

                // Fallback after 5 seconds
                setTimeout(() => resolve(true), 5000);
            });

            await hydrationPromise;

            // 4. Buffer to ensure smooth transition (longer on mobile)
            const bufferTime = isMobile ? 800 : 300;
            await new Promise(resolve => setTimeout(resolve, bufferTime));

            // 5. Hide Native Splash
            if (typeof window !== 'undefined') {
                try {
                    const { SplashScreen } = await import('@capacitor/splash-screen');
                    await SplashScreen.hide({ fadeOutDuration: 300 });
                } catch (e) {
                    console.warn("Splash Screen Hide Failed (Non-Native?)", e);
                }
            }

            // 6. Wait for content to paint (longer on mobile to ensure assets loaded)
            const paintTime = isMobile ? 1000 : 500;
            await new Promise(resolve => setTimeout(resolve, paintTime));

            // 7. Fade out HTML Splash
            setIsVisible(false);
        };

        initSplash();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
            {/* Logo Animation: Zoom In */}
            <div className="relative w-32 h-32 mb-8 animate-in fade-in zoom-in duration-1000">
                <img
                    src="/logo.png"
                    alt="ADH Connect"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Modern CSS Loader (Mobile Safe) */}
            <ModernLoader className="mt-4" />
        </div>
    );
};
