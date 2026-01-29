"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Info, Shield, LogOut, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);

    // Initialize Theme
    useEffect(() => {
        const isDark = document.documentElement.classList.contains("dark");
        setIsDarkMode(isDark);

        // Also check localStorage if not already set
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        }
    }, []);

    const toggleTheme = (checked: boolean) => {
        setIsDarkMode(checked);
        if (checked) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your app preferences and account settings.
                </p>
            </div>

            <Separator />

            {/* Appearance Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        Appearance
                    </CardTitle>
                    <CardDescription>
                        Customize how ADH Connect looks on your device.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="font-medium">Dark Mode</h3>
                            <p className="text-sm text-slate-500">
                                Switch between light and dark themes.
                            </p>
                        </div>
                        <Switch
                            checked={isDarkMode}
                            onCheckedChange={toggleTheme}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Choose what updates you want to receive.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="font-medium">Email Notifications</h3>
                            <p className="text-sm text-slate-500">
                                Receive updates about your courses and community.
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifs}
                            onCheckedChange={(c) => {
                                setEmailNotifs(c);
                                toast.success("Preference saved");
                            }}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="font-medium">Push Notifications</h3>
                            <p className="text-sm text-slate-500">
                                Get alerts on your mobile device.
                            </p>
                        </div>
                        <Switch
                            checked={pushNotifs}
                            onCheckedChange={(c) => {
                                setPushNotifs(c);
                                toast.success("Preference saved");
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Support & About */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        About & Support
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link href="/contact" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">Contact Support</span>
                        </div>
                        <span className="text-xs text-slate-400">support@adh.today</span>
                    </Link>

                    <Link href="/privacy" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">Privacy Policy</span>
                        </div>
                    </Link>

                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">App Version</span>
                        </div>
                        <span className="text-sm text-slate-500">v1.0.0</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
