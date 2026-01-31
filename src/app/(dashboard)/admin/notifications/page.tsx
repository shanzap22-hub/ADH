"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Bell } from "lucide-react";

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-indigo-600" />
                            Send to All Users
                        </CardTitle>
                        <CardDescription>
                            Send a push notification to all users who have the app installed.
                            This is great for announcements, new updates, or alerts.
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
