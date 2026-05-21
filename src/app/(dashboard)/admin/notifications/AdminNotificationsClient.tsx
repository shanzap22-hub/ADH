"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Bell, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminNotificationsPage() {
    // Manual Push State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Stats State
    const [stats, setStats] = useState<any[]>([]);
    const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
    const [statsLoading, setStatsLoading] = useState(true);

    // Target Selection State
    const [targetWeb, setTargetWeb] = useState(true);
    const [targetApp, setTargetApp] = useState(true);

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
                    setTotalSubscribers(statsData.totalSubscribers || 0);
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

        if (!targetWeb && !targetApp) {
            toast.error("Please select at least one target platform (Web or App)");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/notifications/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    title, 
                    message,
                    url,
                    targetWeb,
                    targetApp
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send notification");
            }

            toast.success("Notification sent successfully!");
            setTitle("");
            setMessage("");
            setUrl("");

            // Refresh stats after sending
            setStatsLoading(true);
            const statsRes = await fetch("/api/admin/notifications/stats");
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats || []);
                setTotalSubscribers(statsData.totalSubscribers || 0);
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

            <div className="grid gap-6 max-w-4xl grid-cols-1 md:grid-cols-2">
                <div className="space-y-6">
                    {/* Stats Summary Card */}
                    <Card className="bg-indigo-50 dark:bg-indigo-950 border-indigo-100 dark:border-indigo-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Total Subscribers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <div className="animate-pulse h-10 w-24 bg-indigo-200 dark:bg-indigo-800 rounded"></div>
                            ) : (
                                <div className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">
                                    {totalSubscribers.toLocaleString()}
                                </div>
                            )}
                            <p className="text-sm text-indigo-600/80 dark:text-indigo-400 mt-2">
                                Users opted-in across web and mobile app
                            </p>
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
                                Send a custom push notification to your users.
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Redirect Link / URL (Optional)</label>
                                <Input
                                    placeholder="e.g., /chat or https://adh.today/courses"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-sm font-medium">Target Audience</label>
                                <div className="flex gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="target-app" 
                                            checked={targetApp} 
                                            onCheckedChange={setTargetApp} 
                                        />
                                        <Label htmlFor="target-app" className="cursor-pointer">Mobile App</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="target-web" 
                                            checked={targetWeb} 
                                            onCheckedChange={setTargetWeb} 
                                        />
                                        <Label htmlFor="target-web" className="cursor-pointer">Website</Label>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                            >
                                {isLoading ? "Sending..." : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Notification
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
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
                </div>
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
