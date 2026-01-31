```typescript
"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/hooks/use-platform";

export const OneSignalProvider = () => {
    const { isNative } = usePlatform();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isNative) return;
        if (typeof window === 'undefined') return;

        const OneSignalInit = () => {
            if (isInitialized) return;
            
            // Access OneSignal via window object injected by Cordova/Capacitor
            const OneSignal = (window as any).OneSignal;
            
            if (!OneSignal) {
                console.warn("OneSignal plugin not found. Make sure you are running on a device.");
                return;
            }

            // Remove this method to stop OneSignal Debugging
            OneSignal.setLogLevel(6, 0);
            
            // USE ENV VARIABLE
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "8686c7a8-f9ee-4a88-b2ff-93d74d045383";
            OneSignal.setAppId(appId);

            OneSignal.setNotificationOpenedHandler(function(jsonData: any) {
                console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
            });

            // Prompts the user for notification permissions.
            OneSignal.promptForPushNotificationsWithUserResponse(function(accepted: boolean) {
                console.log("User accepted notifications: " + accepted);
            });
            
            setIsInitialized(true);
        };

        if ((window as any).cordova) {
             document.addEventListener('deviceready', OneSignalInit, false);
        }

    }, [isNative, isInitialized]);

    return null; 
};
```
