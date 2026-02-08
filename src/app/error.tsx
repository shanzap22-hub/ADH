"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to error reporting service (Sentry, LogRocket, etc.)
        console.error("App Error Boundary caught:", error);

        // In production, send to error monitoring
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate error tracking
            // Sentry.captureException(error);
        }
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center space-y-6 text-center p-6 bg-background">
            {/* Error Icon */}
            <div className="bg-destructive/10 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>

            {/* Error Title - Bilingual */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                    എന്തോ കുഴപ്പം സംഭവിച്ചു
                </h1>
                <h2 className="text-xl font-semibold text-muted-foreground">
                    Oops! Something went wrong
                </h2>
            </div>

            {/* Error Description */}
            <p className="text-muted-foreground max-w-md text-sm">
                ക്ഷമിക്കണം, അപ്രതീക്ഷിതമായ പിശക് സംഭവിച്ചു. ഞങ്ങളുടെ ടീമിനെ അറിയിച്ചിട്ടുണ്ട്.
            </p>
            <p className="text-muted-foreground max-w-md text-xs">
                We encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-left bg-muted p-4 rounded-lg max-w-2xl w-full max-h-48 overflow-auto">
                    <p className="text-xs font-mono text-destructive font-semibold mb-2">
                        Development Error Details:
                    </p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                        {error.message}
                    </pre>
                    {error.stack && (
                        <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap">
                            {error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                    )}
                    {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground mt-2">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <Button onClick={reset} size="lg">
                    വീണ്ടും ശ്രമിക്കുക (Try Again)
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                    Reload Page
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
                    Go Home
                </Button>
            </div>

            {/* Support Contact */}
            <p className="text-xs text-muted-foreground pt-4">
                Need help? Contact{' '}
                <a href="mailto:support@adh.today" className="text-primary hover:underline">
                    support@adh.today
                </a>
            </p>
        </div>
    );
}
