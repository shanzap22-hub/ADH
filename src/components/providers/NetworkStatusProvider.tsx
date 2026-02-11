"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastStatusRef = useRef<boolean>(true);
    const lastNotifiedStatusRef = useRef<boolean>(true);

    useEffect(() => {
        const initNetworkStatus = async () => {
            const status = await Network.getStatus();
            setIsOnline(status.connected);
            lastStatusRef.current = status.connected;
            lastNotifiedStatusRef.current = status.connected;
        };

        initNetworkStatus();

        const logNetworkStatus = (status: any) => {
            const online = status.connected;

            // Clear any existing debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Debounce network status changes to prevent rapid notifications
            debounceTimerRef.current = setTimeout(() => {
                // Only process if the status has actually changed
                if (lastStatusRef.current === online) {
                    return;
                }

                // Only show notification if we haven't already notified about this status
                if (lastNotifiedStatusRef.current === online) {
                    lastStatusRef.current = online;
                    setIsOnline(online);
                    return;
                }

                console.log("Network status changed", status);
                lastStatusRef.current = online;
                lastNotifiedStatusRef.current = online;
                setIsOnline(online);

                if (online) {
                    toast.success("Back Online", {
                        description: "Your internet connection is restored.",
                        icon: <Wifi className="w-4 h-4 text-green-500" />,
                        duration: 3000,
                    });
                } else {
                    toast.warning("No Internet Connection", {
                        description: "You are currently offline. Some features may be unavailable.",
                        icon: <WifiOff className="w-4 h-4 text-orange-500" />,
                        duration: 10000,
                    });
                }
            }, 5000); // 5 second debounce delay
        };

        if (Capacitor.isNativePlatform()) {
            const listenerPromise = Network.addListener('networkStatusChange', logNetworkStatus);

            return () => {
                // Determine cleanup based on promise resolution
                listenerPromise.then(listener => {
                    listener.remove().catch(console.error);
                });

                // Clear debounce timer on cleanup
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }

                window.removeEventListener("online", () => { });
                window.removeEventListener("offline", () => { });
            };
        } else {
            // Fallback for web
            const onOnline = () => logNetworkStatus({ connected: true });
            const onOffline = () => logNetworkStatus({ connected: false });

            window.addEventListener("online", onOnline);
            window.addEventListener("offline", onOffline);

            return () => {
                // Clear debounce timer on cleanup
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }

                window.removeEventListener("online", onOnline);
                window.removeEventListener("offline", onOffline);
            };
        }
    }, []);

    return (
        <>
            {!isOnline && (
                <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center text-xs py-1 z-[9999] animate-in slide-in-from-bottom">
                    No Internet Connection
                </div>
            )}
            {children}
        </>
    );
}
