"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Back Online", {
                description: "Your internet connection is restored.",
                icon: <Wifi className="w-4 h-4 text-green-500" />,
                duration: 3000,
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            // Persistent toast until back online? Or just a long duration warning.
            // A persistent sticky warnings is better, but toast is less intrusive as requested.
            // Let's us a long duration toast that user can dismiss.
            toast.warning("No Internet Connection", {
                description: "You are currently offline. Some features may be unavailable.",
                icon: <WifiOff className="w-4 h-4 text-orange-500" />,
                duration: 10000, // Show for 10 seconds
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Crash Guard for WebView/Offline state
        // Prevents white screen "Application error: a client-side exception has occurred"
        const handleGlobalError = (event: ErrorEvent) => {
            // Check if error is network/chunk related
            if (
                event.message?.toLowerCase().includes("loading chunk") ||
                event.message?.toLowerCase().includes("client-side exception") ||
                event.message?.toLowerCase().includes("network")
            ) {
                console.warn("Suppressed offline error:", event.message);
                // Prevent default browser/webview error handling (which might be the white screen)
                event.preventDefault();
            }
        };

        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            if (
                event.reason?.message?.toLowerCase().includes("loading chunk") ||
                event.reason?.message?.toLowerCase().includes("client-side exception") ||
                event.reason?.message?.toLowerCase().includes("network")
            ) {
                console.warn("Suppressed offline promise rejection:", event.reason);
                event.preventDefault();
            }
        };

        window.addEventListener("error", handleGlobalError);
        window.addEventListener("unhandledrejection", handlePromiseRejection);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("error", handleGlobalError);
            window.removeEventListener("unhandledrejection", handlePromiseRejection);
        };
    }, []);

    return (
        <>
            {/* Optional: Sticky Bar for Offline State if you want it more visible than a toast */}
            {!isOnline && (
                <>
                    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center text-xs py-1 z-[9999] animate-in slide-in-from-bottom">
                        No Internet Connection
                    </div>
                    {/* Disable interactions to prevent navigation errors */}
                    <style>{`
                        a, button, [role="button"], input, textarea, select {
                            pointer-events: none !important;
                            opacity: 0.6 !important;
                            filter: grayscale(0.5);
                        }
                    `}</style>
                </>
            )}
            {children}
        </>
    );
}
