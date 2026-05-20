"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard, BookOpen, Video, MessageSquare,
    Users, User, LogOut, Shield, GraduationCap, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

const routes = [
    { label: "Home",        icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Journey",  icon: GraduationCap,  href: "/my-journey" },
    { label: "Programs",     icon: BookOpen,        href: "/courses" },
    { label: "Live",        icon: Video,           href: "/live" },
    { label: "Chat",        icon: MessageSquare,   href: "/chat" },
];

interface StudentSidebarProps {
    is_instructor?: boolean;
    is_super_admin?: boolean;
    permissions: {
        canViewCommunity: boolean;
        canViewLive: boolean;
        canViewChat: boolean;
    };
}

export const StudentSidebar = ({
    is_instructor,
    is_super_admin,
    permissions
}: StudentSidebarProps) => {
    const router   = useRouter();
    const pathname = usePathname();
    const [optimisticPath, setOptimisticPath] = useState(pathname);
    const supabase = createClient();

    useEffect(() => {
        setOptimisticPath(pathname);
    }, [pathname]);

    const handleNavClick = (href: string) => setOptimisticPath(href);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const visibleRoutes = routes.filter(route => {
        if (route.href === "/live")      return permissions.canViewLive;
        if (route.href === "/chat")      return permissions.canViewChat;
        return true;
    });

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800/60">
            <div className="px-8 py-8 border-b border-slate-200/60 dark:border-slate-800/60">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                    ADH Connect
                </p>
            </div>

            <div className="flex flex-col flex-1 px-4 py-6 gap-2">
                {visibleRoutes.map((route) => {
                    const isActive = optimisticPath === route.href || (route.href !== "/dashboard" && route.href !== "/my-journey" && optimisticPath?.startsWith(route.href + "/"));
                    const Icon = route.icon;

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => handleNavClick(route.href)}
                            className={cn(
                                "group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 select-none",
                                isActive
                                    ? "bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 text-white shadow-lg shadow-pink-500/25 scale-[1.02]"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            <Icon className={cn(
                                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
                            )} />

                            <span className="truncate">{route.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto px-4 pb-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                {is_super_admin && (
                    <Link href="/admin" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-3 h-12 rounded-2xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
                            <Shield className="h-4 w-4 text-pink-500" />
                            Admin Center
                        </Button>
                    </Link>
                )}

                {is_instructor && (
                    <Link href="/instructor/courses" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-3 h-12 rounded-2xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
                            <GraduationCap className="h-4 w-4 text-orange-500" />
                            Instructor Mode
                        </Button>
                    </Link>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 rounded-2xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
};
