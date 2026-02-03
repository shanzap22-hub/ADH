"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("App Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full">
                <WifiOff className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Connection Interrupted</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
                It seems like we lost connection or encountered an error loading the content.
            </p>
            <div className="flex gap-4 pt-2">
                <Button onClick={() => reset()} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black">
                    Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Reload Page
                </Button>
            </div>
        </div>
    );
}
