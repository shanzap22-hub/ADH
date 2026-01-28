"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UpgradeTierMessageProps {
    feature: string;
}

export function UpgradeTierMessage({ feature }: UpgradeTierMessageProps) {
    const [isMobileApp, setIsMobileApp] = useState(false);

    useEffect(() => {
        // Detect if running in Capacitor mobile app
        setIsMobileApp(typeof window !== 'undefined' && (window as any).Capacitor !== undefined);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle>{feature} is not available in your current membership tier.</CardTitle>
                    <CardDescription>
                        {isMobileApp
                            ? "To access this feature, please visit our website to upgrade your membership plan."
                            : "Upgrade your membership to unlock this feature and more!"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                    {isMobileApp ? (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Visit <strong className="text-foreground">adh.today</strong> on your web browser
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Log in with your account to view and upgrade your membership plan
                            </p>
                        </div>
                    ) : (
                        <Link href="/pricing">
                            <Button className="w-full">
                                View Membership Plans
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
