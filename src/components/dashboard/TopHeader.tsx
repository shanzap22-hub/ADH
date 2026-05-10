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
    { label: "Home",       icon: Home,           href: "/dashboard" },
    { label: "My Journey", icon: GraduationCap,  href: "/profile"   },
    { label: "Courses",    icon: BookOpen,       href: "/courses"   },
    { label: "Live",       icon: Video,          href: "/live"      },
    { label: "Chat",       icon: MessageCircle,  href: "/chat"      },
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
            <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/40 dark:border-slate-800/40">
                <div className="flex items-center justify-between h-16 px-6 max-w-[1400px] mx-auto">

                    <div className="flex items-center gap-10">
                        <Link href="/dashboard" className="flex items-center group">
                            <div className="relative">
                                <Image
                                    src="/logo.png"
                                    alt="ADH Connect"
                                    width={120}
                                    height={36}
                                    className="h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                                    priority
                                />
                            </div>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                                            isActive
                                                ? "text-violet-600 dark:text-violet-400 bg-violet-500/5 dark:bg-violet-500/10"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-500/5"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-4 w-4 transition-transform group-hover:scale-110",
                                            isActive ? "stroke-[2.5]" : "stroke-[2]"
                                        )} />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 -mb-1" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors text-slate-500 dark:text-slate-400 group"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </button>

                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-violet-500/20"
                                    aria-label="User menu"
                                >
                                    {user?.email ? getInitials(user.email) : "U"}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-3xl border-slate-200/40 dark:border-slate-800/40 backdrop-blur-2xl bg-white/90 dark:bg-slate-950/90 shadow-2xl p-2 mt-2">
                                <DropdownMenuLabel className="px-4 py-3">
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">My Account</p>
                                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200/40 dark:bg-slate-800/40 mx-2" />
                                <DropdownMenuItem
                                    onClick={() => router.push("/profile")}
                                    className="rounded-2xl cursor-pointer py-3 px-4 font-bold text-sm hover:bg-violet-500/5 focus:bg-violet-500/5 transition-colors"
                                >
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push("/settings")}
                                    className="rounded-2xl cursor-pointer py-3 px-4 font-bold text-sm hover:bg-violet-500/5 focus:bg-violet-500/5 transition-colors"
                                >
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200/40 dark:bg-slate-800/40 mx-2" />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="rounded-2xl cursor-pointer py-3 px-4 font-bold text-sm text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 transition-colors"
                                >
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};
