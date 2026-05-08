import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export function usePlatform() {
    const [isNative, setIsNative] = useState(false);
    const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

    useEffect(() => {
        // Defer to avoid cascading renders warning from React Compiler
        const native = Capacitor.isNativePlatform();
        const p = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
        
        setTimeout(() => {
            setIsNative(native);
            setPlatform(p);
        }, 0);
    }, []);

    return {
        isNative, // True if running on Android/iOS App
        isWeb: !isNative, // True if running on Website
        platform // 'android', 'ios', or 'web'
    };
}
