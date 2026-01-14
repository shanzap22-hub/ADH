"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Bell, Search, Home, BookOpen, Video, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
    { label: "Community", icon: Home, href: "/community" },
    { label: "Courses", icon: BookOpen, href: "/courses" },
    { label: "Live", icon: Video, href: "/live" },
    { label: "Chat", icon: MessageCircle, href: "/chat" },
];


export const TopHeader = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        setIsMounted(true);
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login");
        }
    };

    // Get user's initials for avatar fallback
    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase();
    };

    if (!isMounted) {
        return null;
    }

    const isChat = pathname === '/chat' || pathname.startsWith('/chat/');

    return (
        <header className={cn("fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50", isChat && "hidden md:block")}>
            <div className="flex items-center justify-between h-16 px-4">
                {/* Logo/Brand */}
                <div className="flex items-center gap-8">
                    <div className="flex items-center">
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            ADH CONNECT
                        </span>
                    </div>

                    {/* Desktop Navigation Links - Hidden on mobile */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Search - Hidden on mobile */}
                    <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    {/* Notifications */}
                    <button className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        {/* Notification badge */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User Avatar */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white font-semibold hover:scale-105 transition-transform">
                                {user?.email ? getInitials(user.email) : "U"}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">My Account</p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push("/profile")}>
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
