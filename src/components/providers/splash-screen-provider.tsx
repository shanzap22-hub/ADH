"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ModernLoader } from "@/components/ui/modern-loader";

export const SplashScreenProvider = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const initSplash = async () => {
            // Wait for App Load only - NO ARTIFICIAL DELAY
            const loadPromise = new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    resolve(true);
                } else {
                    window.addEventListener('load', () => resolve(true));
                    // Fallback to avoid hanging if load event missed
                    setTimeout(() => resolve(true), 10000);
                }
            });

            await loadPromise;

            // Hide Native Splash
            if (typeof window !== 'undefined') {
                try {
                    const { SplashScreen } = await import('@capacitor/splash-screen');
                    await SplashScreen.hide();
                } catch (e) {
                    console.warn("Splash Screen Hide Failed (Non-Native?)", e);
                }
            }

            // Fade out HTML Splash
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
                    priority
                />
            </div>

            {/* Modern CSS Loader (Mobile Safe) */}
            <ModernLoader className="mt-4" />
        </div>
    );
};
