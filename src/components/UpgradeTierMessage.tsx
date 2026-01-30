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
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="max-w-md w-full text-center space-y-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    This section is not available for your account.
                </p>
            </div>
        </div>
    );
}
