"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ModernLoader } from "@/components/ui/modern-loader";

export const SplashScreenProvider = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const initSplash = async () => {
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

            // 2. Wait for Next.js to hydrate (check for Next.js readiness)
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

            // 3. Small buffer to ensure smooth transition
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Hide Native Splash
            if (typeof window !== 'undefined') {
                try {
                    const { SplashScreen } = await import('@capacitor/splash-screen');
                    await SplashScreen.hide({ fadeOutDuration: 300 });
                } catch (e) {
                    console.warn("Splash Screen Hide Failed (Non-Native?)", e);
                }
            }

            // 5. Wait a bit more for content to paint
            await new Promise(resolve => setTimeout(resolve, 500));

            // 6. Fade out HTML Splash
            setIsVisible(false);
        };

        initSplash();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
            {/* Logo Animation: Zoom In */}
            <div className="relative w-32 h-32 mb-8 animate-in fade-in zoom-in duration-1000">
                <Image
                    src="/logo.png"
                    alt="ADH Connect"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                />
            </div>

            {/* Modern CSS Loader (Mobile Safe) */}
            <ModernLoader className="mt-4" />
        </div>
    );
};
