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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminNotificationsPage() {
    // Manual Push State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Stats State
    const [stats, setStats] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

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
        const fetchConfigAndStats = async () => {
            try {
                // Fetch Settings
                const res = await fetch("/api/admin/notifications/config");
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
                
                // Fetch Stats
                const statsRes = await fetch("/api/admin/notifications/stats");
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.stats || []);
                }
            } catch (e) {
                console.error("Failed to load settings or stats");
            } finally {
                setConfigLoading(false);
                setStatsLoading(false);
            }
        };
        fetchConfigAndStats();
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

            // Refresh stats after sending
            setStatsLoading(true);
            const statsRes = await fetch("/api/admin/notifications/stats");
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats || []);
            }
            setStatsLoading(false);

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

            {/* Analytics Card */}
            <div className="mt-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Broadcast Analytics</CardTitle>
                        <CardDescription>View delivery statistics for your recently sent notifications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-sm text-muted-foreground animate-pulse">Loading analytics...</div>
                        ) : stats.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No recent notifications found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Message</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Delivered</TableHead>
                                            <TableHead className="text-right">Failed</TableHead>
                                            <TableHead className="text-right">Opened</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.map((s, idx) => (
                                            <TableRow key={s.id || idx}>
                                                <TableCell className="font-medium max-w-[200px] truncate">
                                                    <div>{s.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{s.message}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(s.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                        {s.successful}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={s.failed > 0 ? "text-red-500 border-red-200" : "text-slate-400"}>
                                                        {s.failed}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground font-mono text-xs">
                                                    {s.converted}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
