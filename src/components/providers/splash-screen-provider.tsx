"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ModernLoader } from "@/components/ui/modern-loader";

export const SplashScreenProvider = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const initSplash = async () => {
            // 1. Wait for App Load (Browser Window Ready)
            const loadPromise = new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    resolve(true);
                } else {
                    window.addEventListener('load', () => resolve(true));
                    setTimeout(() => resolve(true), 5000); // Fallback
                }
            });

            await loadPromise;

            // 2. Safety Buffer: Ensure React has actually painted the <ModernLoader /> 
            //    This prevents the "White Screen" flash between Native Splash and HTML content.
            await new Promise(resolve => setTimeout(resolve, 500));

            // 3. Hide Native Splash
            if (typeof window !== 'undefined') {
                try {
                    const { SplashScreen } = await import('@capacitor/splash-screen');
                    await SplashScreen.hide();
                } catch (e) {
                    console.warn("Splash Screen Hide Failed (Non-Native?)", e);
                }
            }

            // 4. "Browser Loading" Simulation / Data Wait
            //    User requested: "3 seconds fixed time... until loading comes"
            //    We keep the HTML Spinner visible for 3s to represent this loading phase.
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 5. Fade out HTML Splash
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
