
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    url?: string;
}

export function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Initial fetch
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/notifications/list");
                if (res.ok) {
                    const data = await res.json();
                    const fetchedNotifications: Notification[] = data.notifications || [];

                    setNotifications(fetchedNotifications);

                    // Check for unread
                    const lastRead = localStorage.getItem("last_read_notification_time");
                    if (fetchedNotifications.length > 0) {
                        const latestTime = new Date(fetchedNotifications[0].created_at).getTime();
                        if (!lastRead || latestTime > parseInt(lastRead)) {
                            setHasUnread(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && notifications.length > 0) {
            setHasUnread(false);
            // Mark all as read by saving current timestamp
            if (notifications.length > 0) {
                const latestTime = new Date(notifications[0].created_at).getTime();
                localStorage.setItem("last_read_notification_time", latestTime.toString());
            }
        }
    };

    const handleClearAll = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/notifications/clear-all", {
                method: "POST",
            });
            if (res.ok) {
                setNotifications([]);
                setHasUnread(false);
            } else {
                toast.error("Failed to clear notifications");
            }
        } catch (error) {
            console.error("Failed to clear notifications", error);
            toast.error("Failed to clear notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        // Toggle close
        setIsOpen(false);

        console.log("Notification clicked:", notification);

        // Redirect if URL exists
        if (notification.url && notification.url.trim() !== "") {
            console.log("Redirecting to:", notification.url);
            router.push(notification.url);
            return;
        }

        // Fallback Logic: Infer destination from Title/Content
        const titleLower = notification.title.toLowerCase();
        const messageLower = notification.message.toLowerCase();
        const combinedText = `${titleLower} ${messageLower}`;

        // Announcements (redirect to community feed)
        if (titleLower.includes("announcement")) {
            console.log("Redirecting to /community (Announcement)");
            router.push("/community");
            return;
        }

        // Community Chat (most specific first)
        if ((titleLower.includes("community") && titleLower.includes("chat")) ||
            combinedText.includes("sent a message") ||
            combinedText.includes("sent an image") ||
            combinedText.includes("new message")) {
            console.log("Redirecting to /chat?action=community (Community Chat)");
            router.push("/chat?action=community");
            return;
        }

        // Community Feed/Posts
        if ((titleLower.includes("community") && (titleLower.includes("feed") || titleLower.includes("post"))) ||
            combinedText.includes("posted in") ||
            combinedText.includes("new post") ||
            combinedText.includes("community feed")) {
            console.log("Redirecting to /community (Community Feed)");
            router.push("/community");
            return;
        }

        // Generic Community (fallback to feed)
        if (titleLower.includes("community")) {
            console.log("Redirecting to /community (Generic Community)");
            router.push("/community");
            return;
        }

        // Live Sessions
        if (titleLower.includes("live") || combinedText.includes("live session") || combinedText.includes("going live")) {
            console.log("Redirecting to /live");
            router.push("/live");
            return;
        }

        // AI/Coach
        if (titleLower.includes("ai") || titleLower.includes("coach")) {
            console.log("Redirecting to /chat?action=ai");
            router.push("/chat?action=ai");
            return;
        }

        // Generic chat or message
        if (titleLower.includes("chat") || titleLower.includes("message")) {
            console.log("Redirecting to /chat");
            router.push("/chat");
            return;
        }

        // Courses
        if (titleLower.includes("course") || titleLower.includes("lesson")) {
            console.log("Redirecting to /courses");
            router.push("/courses");
            return;
        }

        console.log("No URL for notification");
        toast("Notification", {
            description: "This notification has no link attached.",
        });
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition outline-none">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    {/* Notification badge */}
                    {hasUnread && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {notifications.length}
                            </span>
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2">
                            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-muted-foreground">Loading updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                            <span className="text-2xl mb-2">📭</span>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b last:border-0 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h5 className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {notification.title}
                                        </h5>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
