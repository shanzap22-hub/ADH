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
    { label: "Dashboard",   icon: LayoutDashboard, href: "/dashboard", color: "text-violet-400" },
    { label: "My Learning", icon: BookOpen,         href: "/courses",   color: "text-indigo-400" },
    { label: "Live Class",  icon: Video,            href: "/live",      color: "text-rose-400"   },
    { label: "AI Mentor",   icon: MessageSquare,    href: "/chat",      color: "text-emerald-400"},
    { label: "Community",   icon: Users,            href: "/community", color: "text-amber-400"  },
    { label: "Profile",     icon: User,             href: "/profile",   color: "text-sky-400"    },
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
        if (route.href === "/community") return permissions.canViewCommunity;
        if (route.href === "/live")      return permissions.canViewLive;
        if (route.href === "/chat")      return permissions.canViewChat;
        return true;
    });

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800/60">

            {/* Section label */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Student Portal
                </p>
            </div>

            {/* Nav links */}
            <div className="flex flex-col flex-1 px-3 py-3 gap-0.5">
                {visibleRoutes.map((route) => {
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
                            {/* Active pill */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-600 dark:bg-violet-400 rounded-full" />
                            )}

                            <Icon className={cn(
                                "h-[18px] w-[18px] shrink-0 transition-colors",
                                isActive ? "text-violet-600 dark:text-violet-400" : route.color
                            )} />

                            <span className="truncate">{route.label}</span>

                            {isActive && (
                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400 opacity-60" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom actions */}
            <div className="mt-auto px-3 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                {/* Admin Mode */}
                {is_super_admin && (
                    <Link href="/admin">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-xs hover:border-violet-300 hover:text-violet-700">
                            <Shield className="h-3.5 w-3.5" />
                            Admin Mode
                        </Button>
                    </Link>
                )}

                {/* Instructor Mode */}
                {is_instructor && (
                    <Link href="/instructor/courses">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-xs hover:border-violet-300 hover:text-violet-700">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Instructor Mode
                        </Button>
                    </Link>
                )}

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-9 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={handleLogout}
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                </Button>
            </div>
        </div>
    );
};
