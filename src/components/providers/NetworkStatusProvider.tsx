"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import { WifiOff } from "lucide-react";
import { usePlatform } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";

export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
    const { isNative } = usePlatform();
    const [status, setStatus] = useState<{ connected: boolean; connectionType: string }>({
        connected: true,
        connectionType: 'unknown'
    });
    const [retryLoading, setRetryLoading] = useState(false);

    useEffect(() => {
        // Only run logic effectively if on Native, or just always for safety?
        // Let's run always, as it helps Web users too, but primarily for App Approval

        async function checkStatus() {
            try {
                const currentStatus = await Network.getStatus();
                setStatus(currentStatus);
            } catch (e) {
                // Fallback for non-capacitor env if it throws (unlikely with plugin)
                if (typeof navigator !== 'undefined') {
                    setStatus({ connected: navigator.onLine, connectionType: 'wifi' });
                }
            }
        }

        checkStatus();

        const handler = Network.addListener("networkStatusChange", (status) => {
            console.log("Network status changed", status);
            setStatus(status);
        });

        // Also standard window listeners as backup
        const onOnline = () => setStatus(prev => ({ ...prev, connected: true }));
        const onOffline = () => setStatus(prev => ({ ...prev, connected: false }));

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            handler.then(h => h.remove());
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const handleRetry = () => {
        setRetryLoading(true);
        setTimeout(async () => {
            const currentStatus = await Network.getStatus();
            setStatus(currentStatus);
            setRetryLoading(false);
            if (currentStatus.connected) {
                window.location.reload();
            }
        }, 1000);
    };

    if (!status.connected) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                    <WifiOff className="h-10 w-10 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Internet Connection</h2>
                <p className="text-slate-500 mb-8 max-w-sm">
                    Please check your internet settings and try again. The app requires an active connection.
                </p>
                <Button onClick={handleRetry} disabled={retryLoading} size="lg">
                    {retryLoading ? "Checking..." : "Try Again"}
                </Button>
            </div>
        );
    }

    return <>{children}</>;
};
