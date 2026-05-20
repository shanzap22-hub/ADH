"use client";

import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useRouter, usePathname } from "next/navigation";
import { MetaballLoader } from "@/components/ui/metaball-loader";

export const BackButtonHandler = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setIsLoading(false);
    }

    useEffect(() => {
        const handlePopState = () => {
            // Only dismiss loader on popstate if we are in the chat page
            // This allows the image overlay to close without a stuck spinner, 
            // while keeping default behavior (spinner on back) for other pages if desired.
            if (window.location.pathname.startsWith('/chat') || window.location.pathname.includes('/chat')) {
                setIsLoading(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        let isListening = true;

        const setupListener = async () => {
            try {
                await CapacitorApp.removeAllListeners();
                await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                    if (!isListening) return;

                    // ആപ്പിൽ ഏതെങ്കിലും ഡയലോഗുകൾ (Modal, Sheet, Dialog) തുറന്നിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.
                    // Radix UI, CSS modal-കൾ എന്നിവയ്ക്ക് സാധാരണയായി [role="dialog"] അല്ലെങ്കിൽ [data-state="open"] ഉണ്ടാകും.
                    const activeDialog = document.querySelector('[role="dialog"], [data-state="open"], .fixed.inset-0.z-50');
                    if (activeDialog) {
                        // Escape കീ പ്രസ്സ് ചെയ്തതായി സിമുലേറ്റ് ചെയ്യുക (ഇതിലൂടെ മോഡലുകൾ/ഡയലോഗുകൾ തനിയെ അടയും)
                        const event = new KeyboardEvent('keydown', { 
                            key: 'Escape', 
                            code: 'Escape', 
                            keyCode: 27, 
                            which: 27, 
                            bubbles: true, 
                            cancelable: true 
                        });
                        document.dispatchEvent(event);
                        
                        // ചില സാഹചര്യങ്ങളിൽ Escape പ്രസ്സ് ചെയ്താലും അടയാത്ത UI ഉണ്ടാകാം, 
                        // അതിനാൽ പ്രോഗ്രമാറ്റിക്കലി ക്ലോസ് ബട്ടൺ ഉണ്ടെങ്കിൽ ക്ലിക്ക് ചെയ്യാനും ഒരു ബാക്കപ്പ് നൽകാം.
                        const closeButton = activeDialog.querySelector('button[aria-label="Close"], button.absolute.right-4.top-4') as HTMLButtonElement;
                        if (closeButton) {
                            closeButton.click();
                        }
                        
                        return; // ഡയലോഗ് അടച്ചതിനാൽ ബാക്ക് പോകാതെ ഇവിടെ വച്ച് നിർത്തുന്നു
                    }

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
