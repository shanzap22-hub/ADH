"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Dashboard Error]:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-background">
            <div className="max-w-md text-center space-y-6">
                {/* Error Icon */}
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Dashboard Error
                    </h1>
                    <p className="text-muted-foreground">
                        We encountered an error loading your dashboard. This could be a temporary issue.
                    </p>
                </div>

                {/* Development Details */}
                {process.env.NODE_ENV === "development" && error.message && (
                    <div className="text-left bg-muted p-4 rounded-lg max-h-32 overflow-auto">
                        <p className="text-xs font-mono text-destructive font-semibold mb-1">
                            Error Details:
                        </p>
                        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                            {error.message}
                        </pre>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} size="lg" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => (window.location.href = "/")}
                        className="gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Button>
                </div>

                {/* Support */}
                <p className="text-xs text-muted-foreground pt-4">
                    Issue persists?{" "}
                    <a
                        href="mailto:support@adh.today"
                        className="text-primary hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
