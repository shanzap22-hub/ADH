"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Bell, Search, Home, BookOpen, Video, MessageCircle, GraduationCap } from "lucide-react";
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
import { NotificationBell } from "./NotificationBell";
import { SearchModal } from "./SearchModal";

const navItems = [
    { label: "Home",       icon: Home,          href: "/dashboard" },
    { label: "Live",       icon: Video,         href: "/live"      },
    { label: "Courses",    icon: BookOpen,      href: "/courses"   },
    { label: "Chat",       icon: MessageCircle, href: "/chat"      },
    { label: "My Journey", icon: GraduationCap, href: "/profile"   },
];

export const TopHeader = () => {
    const [user, setUser]           = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router   = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        setTimeout(() => setIsMounted(true), 0);
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
        } catch {
            router.push("/login");
        }
    };

    const getInitials = (email: string) => email.charAt(0).toUpperCase();

    if (!isMounted) return null;

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/50">
                <div className="flex items-center justify-between h-14 px-4">

                    {/* Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="ADH Connect"
                                width={120}
                                height={36}
                                className="h-9 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-0.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1.5">
                        {/* Search button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none text-slate-500 dark:text-slate-400"
                            aria-label="Search"
                        >
                            <Search className="h-[18px] w-[18px]" />
                        </button>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* User Avatar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold hover:scale-105 transition-transform shadow-sm shadow-violet-500/30 outline-none"
                                    aria-label="User menu"
                                >
                                    {user?.email ? getInitials(user.email) : "U"}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200/60 shadow-xl shadow-black/10 p-1">
                                <DropdownMenuLabel className="px-3 py-2">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">My Account</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                    onClick={() => router.push("/profile")}
                                    className="rounded-xl cursor-pointer"
                                >
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push("/settings")}
                                    className="rounded-xl cursor-pointer"
                                >
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                                >
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};
