"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard, Compass, Radio, Users, Settings, Eye,
    UserPlus, LogOut, Shield, Calendar as CalendarIcon,
    Clock, Network, FileText, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

const routes = [
    { label: "Programs",        icon: Compass,    href: "/instructor/courses",      color: "text-violet-500" },
    { label: "Community",      icon: Users,       href: "/instructor/community",    color: "text-indigo-400" },
    { label: "Live Manager",   icon: Radio,       href: "/instructor/live-manager", color: "text-rose-400"   },
    { label: "Availability",   icon: Clock,       href: "/instructor/availability", color: "text-amber-400"  },
    { label: "Enroll Students",icon: UserPlus,    href: "/instructor/enroll",       color: "text-emerald-400"},
    { label: "Mind Maps",      icon: Network,     href: "/instructor/mind-maps",    color: "text-pink-400"   },
    { label: "Master Notes",   icon: FileText,    href: "/instructor/notes",        color: "text-teal-400"   },
    { label: "Settings",       icon: Settings,    href: "/instructor/settings",     color: "text-slate-400"  },
];

interface SidebarProps {
    is_super_admin?: boolean;
}

export const Sidebar = ({ is_super_admin }: SidebarProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [optimisticPath, setOptimisticPath] = useState(pathname);
    const supabase = createClient();

    useEffect(() => {
        setOptimisticPath(pathname);
    }, [pathname]);

    const handleNavClick = (href: string) => {
        setOptimisticPath(href);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800/60">

            {/* Logo Section */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center justify-center">
                    <Image
                        src="/logo.png"
                        alt="ADH Connect"
                        width={140}
                        height={40}
                        className="h-16 w-auto object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Nav Links */}
            <div className="flex flex-col flex-1 px-3 py-4 gap-0.5">
                {routes.map((route) => {
                    const isActive = optimisticPath === route.href || optimisticPath?.startsWith(route.href + "/");
                    const Icon = route.icon;

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => handleNavClick(route.href)}
                            className={cn(
                                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none",
                                isActive
                                    ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-600 dark:bg-violet-400 rounded-full" />
                            )}

                            <Icon className={cn(
                                "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                                isActive ? "text-violet-600 dark:text-violet-400" : route.color
                            )} />

                            <span className="truncate">{route.label}</span>

                            {isActive && (
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400 dark:text-violet-500 opacity-60" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto px-3 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                {/* Admin Mode */}
                {is_super_admin && (
                    <Link href="/admin">
                        <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300" size="sm">
                            <Shield className="h-3.5 w-3.5" />
                            Admin Mode
                        </Button>
                    </Link>
                )}

                {/* Student Mode */}
                <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200 dark:border-slate-700" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                        Student Mode
                    </Button>
                </Link>

                {/* Logout */}
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    size="sm"
                    onClick={handleLogout}
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                </Button>
            </div>
        </div>
    );
};
