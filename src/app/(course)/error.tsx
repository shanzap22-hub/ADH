"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CourseError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Course Error]:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-md text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Unable to Load Course
                    </h1>
                    <p className="text-muted-foreground">
                        We had trouble loading this course. It might be temporarily unavailable or you may not have access.
                    </p>
                </div>

                {process.env.NODE_ENV === "development" && error.message && (
                    <div className="text-left bg-muted p-4 rounded-lg max-h-32 overflow-auto">
                        <p className="text-xs font-mono text-destructive font-semibold mb-1">
                            Dev Error:
                        </p>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                            {error.message}
                        </pre>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} size="lg">
                        Try Again
                    </Button>
                    <Link href="/courses">
                        <Button variant="outline" size="lg" className="gap-2 w-full">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Courses
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
