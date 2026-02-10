"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const initNetworkStatus = async () => {
            const status = await Network.getStatus();
            setIsOnline(status.connected);
        };

        initNetworkStatus();

        const logNetworkStatus = (status: any) => {
            console.log("Network status changed", status);
            const online = status.connected;
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
        };

        let networkListener: any;

        if (Capacitor.isNativePlatform()) {
            Network.addListener('networkStatusChange', logNetworkStatus).then(listener => {
                networkListener = listener;
            });
        } else {
            // Fallback for web
            window.addEventListener("online", () => logNetworkStatus({ connected: true }));
            window.addEventListener("offline", () => logNetworkStatus({ connected: false }));
        }

        return () => {
            if (networkListener) {
                networkListener.remove();
            }
            window.removeEventListener("online", () => { });
            window.removeEventListener("offline", () => { });
        };
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
