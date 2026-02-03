"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminNotificationsPage() {
    // Manual Push State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        community_posts: true,
        live_reminders: true,
        live_start: true,
        one_on_one: true
    });
    const [configLoading, setConfigLoading] = useState(true);

    // Fetch config on load
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/admin/notifications/config");
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (e) {
                console.error("Failed to load settings");
            } finally {
                setConfigLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const toggleSetting = async (key: string, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        // Save immediately
        try {
            await fetch("/api/admin/notifications/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSettings)
            });
            toast.success("Current settings saved");
        } catch (e) {
            toast.error("Failed to save settings");
            // Revert on error
            setSettings(settings);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Please enter both title and message");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/notifications/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send notification");
            }

            toast.success("Notification sent successfully to all users!");
            setTitle("");
            setMessage("");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Push Notifications</h1>

            <div className="grid gap-6 max-w-2xl">
                {/* Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Automated Notifications</CardTitle>
                        <CardDescription>Manage which events trigger automatic push notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Community Posts</Label>
                                <p className="text-sm text-muted-foreground">Notify users when a new post is added to the feed.</p>
                            </div>
                            <Switch
                                checked={settings.community_posts}
                                onCheckedChange={(c) => toggleSetting('community_posts', c)}
                                disabled={configLoading}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Live Session Reminders</Label>
                                <p className="text-sm text-muted-foreground">Send reminder 1 hour before scheduled Weekly Live.</p>
                            </div>
                            <Switch
                                checked={settings.live_reminders}
                                onCheckedChange={(c) => toggleSetting('live_reminders', c)}
                                disabled={configLoading}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Live Session Start</Label>
                                <p className="text-sm text-muted-foreground">Notify instantly when Live Session starts.</p>
                            </div>
                            <Switch
                                checked={settings.live_start}
                                onCheckedChange={(c) => toggleSetting('live_start', c)}
                                disabled={configLoading}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">1-on-1 Sessions</Label>
                                <p className="text-sm text-muted-foreground">Notify student when their 1-on-1 session is about to start.</p>
                            </div>
                            <Switch
                                checked={settings.one_on_one}
                                onCheckedChange={(c) => toggleSetting('one_on_one', c)}
                                disabled={configLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Push Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-indigo-600" />
                            Send Manual Broadcast
                        </CardTitle>
                        <CardDescription>
                            Send a custom push notification to all users who have the app installed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notification Title</label>
                            <Input
                                placeholder="e.g., Live Class Starting Soon!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Details</label>
                            <Textarea
                                placeholder="e.g., Join us now for the weekly catchup..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isLoading ? "Sending..." : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Notification
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Note: Delivery depends on user device settings and internet connection.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
