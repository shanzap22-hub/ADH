import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export function usePlatform() {
    const [isNative, setIsNative] = useState(false);
    const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        setPlatform(Capacitor.getPlatform() as 'web' | 'ios' | 'android');
    }, []);

    return {
        isNative, // True if running on Android/iOS App
        isWeb: !isNative, // True if running on Website
        platform // 'android', 'ios', or 'web'
    };
}
