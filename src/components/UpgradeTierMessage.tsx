"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpgradeTierMessageProps {
    feature: string;
}

export function UpgradeTierMessage({ feature }: UpgradeTierMessageProps) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-md text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                    <Lock className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>

                <h2 className="text-2xl font-bold mb-3">Upgrade Required</h2>

                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{feature}</span> is not available in your current membership tier.
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
                    Upgrade your membership to unlock this feature and more!
                </p>

                <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Link href="/pricing">
                        View Membership Plans
                    </Link>
                </Button>
            </div>
        </div>
    );
}
