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

    // Initialize Theme & Notification Preferences from localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        const storedEmail = localStorage.getItem("pref_email_notifs");
        const storedPush = localStorage.getItem("pref_push_notifs");

        setTimeout(() => {
            if (storedTheme === "dark") {
                document.documentElement.classList.add("dark");
                setIsDarkMode(true);
            }
            // Only override defaults if user has explicitly set a preference
            if (storedEmail !== null) setEmailNotifs(storedEmail === "true");
            if (storedPush !== null) setPushNotifs(storedPush === "true");
        }, 0);
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
                                Receive updates about your Programs and community.
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifs}
                            onCheckedChange={(c) => {
                                setEmailNotifs(c);
                                localStorage.setItem("pref_email_notifs", String(c));
                                toast.success(c ? "Email notifications enabled" : "Email notifications disabled");
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
                                localStorage.setItem("pref_push_notifs", String(c));
                                toast.success(c ? "Push notifications enabled" : "Push notifications disabled");
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Support & Legal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        About & Support
                    </CardTitle>
                    <CardDescription>
                        Get help and review legal information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Link href="/contact" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">Contact Support</span>
                        </div>
                        <span className="text-xs text-slate-400">info@adh.today</span>
                    </Link>

                    <Separator className="my-2" />

                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground px-3 pt-2">
                            Legal Information
                        </p>
                        <Link href="/privacy" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-blue-500" />
                                <span className="font-medium">Privacy Policy</span>
                            </div>
                            <span className="text-xs text-slate-400">→</span>
                        </Link>
                        <Link href="/terms" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Terms of Service</span>
                            </div>
                            <span className="text-xs text-slate-400">→</span>
                        </Link>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">App Version</span>
                        </div>
                        <span className="text-sm text-slate-500">v1.1.0</span>
                    </div>
                </CardContent>
            </Card>

            {/* Account Danger Zone */}
            <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10">
                <CardHeader>
                    <CardTitle className="text-rose-600 dark:text-rose-400">Account Management</CardTitle>
                    <CardDescription>Actions that affect your account session and data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3 h-12 rounded-2xl border-slate-200 dark:border-slate-800"
                        onClick={() => {
                            toast.loading("Signing out...");
                            // This would use the sign-out logic from the top header
                            window.location.href = "/signout";
                        }}
                    >
                        <LogOut className="h-4 w-4 text-rose-500" />
                        <span className="font-bold">Sign Out from Device</span>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
