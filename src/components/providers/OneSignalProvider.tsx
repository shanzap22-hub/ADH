"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/hooks/use-platform";
import { useRouter } from "next/navigation";

export const OneSignalProvider = () => {
    const { isNative } = usePlatform();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

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

                // Listen for notification click/tap events
                OneSignal.Notifications.addEventListener("click", (event: any) => {
                    console.log("OneSignal: Notification Clicked:", event);
                    const notification = event?.notification;
                    const additionalData = notification?.additionalData;
                    const launchURL = notification?.launchURL;
                    
                    const urlToOpen = launchURL || additionalData?.url;
                    if (urlToOpen) {
                        try {
                            if (urlToOpen.startsWith("https://adh.today") || urlToOpen.startsWith("/")) {
                                // Route inside the app
                                const path = urlToOpen.replace("https://adh.today", "");
                                router.push(path);
                            } else {
                                // Open external link in Capacitor Browser
                                import('@capacitor/browser').then(({ Browser }) => {
                                    Browser.open({ url: urlToOpen });
                                }).catch(() => {
                                    window.open(urlToOpen, '_blank');
                                });
                            }
                        } catch (e) {
                            console.error("OneSignal: Redirect failed", e);
                        }
                    }
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

                const syncMutedChats = async (userId: string) => {
                    try {
                        const { data: mutedChats } = await supabase
                            .from('chat_notification_settings')
                            .select('conversation_id')
                            .eq('user_id', userId)
                            .eq('is_muted', true);
                            
                        if (mutedChats && mutedChats.length > 0) {
                            mutedChats.forEach(chat => {
                                OneSignal.User.addTag(`muted_chat_${chat.conversation_id}`, "true");
                            });
                        }
                    } catch (e) {
                        console.error("Failed to sync muted chats", e);
                    }
                };

                // Check current session
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    console.log("OneSignal: Logging in user", session.user.id);
                    OneSignal.login(session.user.id);
                    OneSignal.User.addTag("user_id", session.user.id);
                    await syncMutedChats(session.user.id);
                }

                // Listen for auth changes
                supabase.auth.onAuthStateChange(async (event, session) => {
                    if (session?.user?.id) {
                        console.log("OneSignal: Auth Change - Logging in", session.user.id);
                        OneSignal.login(session.user.id);
                        OneSignal.User.addTag("user_id", session.user.id);
                        await syncMutedChats(session.user.id);
                    } else {
                        console.log("OneSignal: Auth Change - Logging out");
                        OneSignal.User.removeTag("user_id");
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


