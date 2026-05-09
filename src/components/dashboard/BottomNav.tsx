"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Video, MessageCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_NAV_ITEMS = [
    { label: "Home",       icon: Home,           href: "/dashboard", perm: null          },
    { label: "My Journey", icon: GraduationCap,  href: "/my-journey", perm: null          },
    { label: "Courses",    icon: BookOpen,       href: "/courses",   perm: null,  isCenter: true },
    { label: "Live",       icon: Video,          href: "/live",      perm: "canViewLive" },
    { label: "Chat",       icon: MessageCircle,  href: "/chat",      perm: "canViewChat" },
];

interface BottomNavProps {
    permissions?: {
        canViewCommunity: boolean;
        canViewLive: boolean;
        canViewChat: boolean;
        hideOnPlayer?: boolean;
    };
}

export const BottomNav = ({ permissions }: BottomNavProps) => {
    const pathname = usePathname();
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [optimisticPath, setOptimisticPath] = useState(pathname);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setOptimisticPath(pathname);
    }

    const handleNavClick = (href: string) => {
        if (href !== pathname) setOptimisticPath(href);
    };

    const isPlayerPage = pathname.includes("/chapters/") || pathname.includes("/learn");
    if (permissions?.hideOnPlayer && isPlayerPage) return null;

    const visibleItems = ALL_NAV_ITEMS.filter(item => {
        if (item.perm === "canViewLive" && permissions && !permissions.canViewLive) return false;
        if (item.perm === "canViewChat" && permissions && !permissions.canViewChat) return false;
        return true;
    });

    if (visibleItems.length === 0) return null;

    const centerIndex = visibleItems.findIndex(item => item.isCenter);

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-4 mb-4 relative rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">

                {(() => {
                    const activeIndex = visibleItems.findIndex(item =>
                        optimisticPath === item.href ||
                        (item.href !== "/dashboard" && item.href !== "/my-journey" && optimisticPath.startsWith(item.href + "/"))
                    );
                    const isActiveCenter = activeIndex === centerIndex;
                    const itemWidth = 100 / visibleItems.length;

                    if (activeIndex !== -1 && !isActiveCenter) {
                        return (
                            <div
                                className="absolute top-2 bottom-2 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none"
                                style={{
                                    width: `calc(${itemWidth}% - 12px)`,
                                    left:  `calc(${activeIndex * itemWidth}% + 6px)`,
                                }}
                            />
                        );
                    }
                    return null;
                })()}

                <div
                    className="relative grid h-[68px]"
                    style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
                >
                    {visibleItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = optimisticPath === item.href ||
                            (item.href !== "/dashboard" && item.href !== "/my-journey" && optimisticPath.startsWith(item.href + "/"));
                        const isCenter = item.isCenter;

                        if (isCenter) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => handleNavClick(item.href)}
                                    className="relative z-10 flex flex-col items-center justify-center active:scale-95 transition-transform"
                                    style={{ WebkitTapHighlightColor: "transparent" }}
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-[22px] flex items-center justify-center shadow-2xl transition-all duration-500 -mt-8 border-4 border-[#f7f6ff] dark:border-slate-950",
                                        isActive
                                            ? "bg-gradient-to-br from-violet-600 to-purple-700 scale-110 rotate-3"
                                            : "bg-white dark:bg-slate-800"
                                    )}>
                                        <Icon className={cn(
                                            "h-6 w-6 transition-colors duration-300",
                                            isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-[11px] font-bold mt-1 tracking-tight transition-colors duration-300",
                                        isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-500"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                    "relative z-10 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-300",
                                    isActive
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                <Icon className={cn(
                                    "transition-all duration-500",
                                    isActive ? "h-[24px] w-[24px] stroke-[2.5]" : "h-5 w-5 stroke-[2]"
                                )} />
                                <span className={cn(
                                    "text-[11px] font-bold tracking-tight",
                                    isActive ? "opacity-100" : "opacity-80"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
