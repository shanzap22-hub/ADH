"use client";

import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useRouter, usePathname } from "next/navigation";
import { MetaballLoader } from "@/components/ui/metaball-loader";

export const BackButtonHandler = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);

    // Reset loading state on path change
    useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    useEffect(() => {
        let isListening = true;

        const setupListener = async () => {
            try {
                await CapacitorApp.removeAllListeners();
                await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                    if (!isListening) return;

                    const currentPath = window.location.pathname;
                    const exitPaths = ['/dashboard', '/', '/login', '/home'];
                    const isRoot = exitPaths.some(path => currentPath === path || currentPath === `${path}/`);

                    if (isRoot) {
                        CapacitorApp.exitApp();
                    } else {
                        setIsLoading(true);
                        router.back();
                    }
                });
            } catch (error) {
                console.warn("Capacitor App plugin not available:", error);
            }
        };

        setupListener();

        return () => {
            isListening = false;
            // Don't remove all listeners indiscriminately if possible, but strict cleanup is okay here
        };
    }, [router]);

    return isLoading ? <MetaballLoader fullscreen /> : null;
};
