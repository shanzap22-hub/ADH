"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/hooks/use-platform";

export const OneSignalProvider = () => {
    const { isNative } = usePlatform();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isNative) {
            return;
        }

        const APP_ID = "8686c7a8-f9ee-4a88-b2ff-93d74d045383";

        const initOneSignal = async () => {
            try {
                // Dynamically import OneSignal to avoid SSR issues with 'window'
                const OneSignalModule = await import('onesignal-cordova-plugin');
                const OneSignal = OneSignalModule.default;

                // Debugging messages
                console.log("OneSignal Module Loaded:", OneSignal);

                if (!OneSignal) {
                    console.error("OneSignal: Critical Error - Module default export is undefined.");
                    return;
                }

                console.log("OneSignal: Initializing (v5) with ID", APP_ID);

                // Initialize OneSignal
                OneSignal.initialize(APP_ID);


                // Request Notification Permissions
                OneSignal.Notifications.requestPermission(true).then((granted: boolean) => {
                    console.log("OneSignal: Permission Granted:", granted);
                });

                // Feature: Mic Perms are now requested lazily in ChatWindow.tsx
                // This prevents the "Green Dot" (Recording Indicator) from appearing at app launch.

                // Identify User
                // We likely need to import the supabase client to get the user ID
                // For now, we dispatch a custom event or check local storage if available, 
                // but ideally we should listen to auth changes.
                // Let's assume we can get it from the window/session for now or add the listener.

                // Better approach: Since we are in a provider, we can't easily import the session 
                // without making this component complicated. 
                // However, since we need it for 1-to-1 notifications, we will try to fetch it.

                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();

                // Check current session
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    console.log("OneSignal: Logging in user", session.user.id);
                    OneSignal.login(session.user.id);
                }

                // Listen for auth changes
                supabase.auth.onAuthStateChange((event, session) => {
                    if (session?.user?.id) {
                        console.log("OneSignal: Auth Change - Logging in", session.user.id);
                        OneSignal.login(session.user.id);
                    } else {
                        console.log("OneSignal: Auth Change - Logging out");
                        OneSignal.logout();
                    }
                });

            } catch (error) {
                console.error("OneSignal: Init Failed", error);
            }
        };

        if (document.readyState === 'complete') {
            initOneSignal();
        } else {
            document.addEventListener('deviceready', initOneSignal, false);
        }

        return () => {
            document.removeEventListener('deviceready', initOneSignal);
        };

    }, [isNative, mounted]);

    return null;
};


