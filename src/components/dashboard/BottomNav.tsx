"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Video, MessageCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav item definitions — Courses is always index 2 (center) ──────
const ALL_NAV_ITEMS = [
    { label: "Home",       icon: Home,           href: "/dashboard", perm: null          },
    { label: "Live",       icon: Video,          href: "/live",      perm: "canViewLive" },
    { label: "Courses",    icon: BookOpen,       href: "/courses",   perm: null,  isCenter: true },
    { label: "Chat",       icon: MessageCircle,  href: "/chat",      perm: "canViewChat" },
    { label: "My Journey", icon: GraduationCap,  href: "/profile",   perm: null          },
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

    // Sync optimistic path with real path when navigation completes
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setOptimisticPath(pathname);
    }

    const handleNavClick = (href: string) => {
        if (href !== pathname) setOptimisticPath(href);
    };

    // Hide on chapter/player pages
    const isPlayerPage = pathname.includes("/chapters/") || pathname.includes("/learn");
    if (permissions?.hideOnPlayer && isPlayerPage) return null;

    // Filter based on permissions
    const visibleItems = ALL_NAV_ITEMS.filter(item => {
        if (item.perm === "canViewLive" && permissions && !permissions.canViewLive) return false;
        if (item.perm === "canViewChat" && permissions && !permissions.canViewChat) return false;
        return true;
    });

    if (visibleItems.length === 0) return null;

    // Find center item index (Courses)
    const centerIndex = visibleItems.findIndex(item => item.isCenter);

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            {/* Floating glass pill */}
            <div className="mx-3 mb-3 relative rounded-2xl bg-white/95 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xl shadow-black/10 dark:shadow-black/50">

                {/* Sliding background pill for non-center active tabs */}
                {(() => {
                    const activeIndex = visibleItems.findIndex(item =>
                        optimisticPath === item.href ||
                        (item.href !== "/dashboard" && item.href !== "/profile" && optimisticPath.startsWith(item.href + "/"))
                    );
                    const isActiveCenter = activeIndex === centerIndex;
                    const itemWidth = 100 / visibleItems.length;

                    if (activeIndex !== -1 && !isActiveCenter) {
                        return (
                            <div
                                className="absolute top-1.5 bottom-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 transition-all duration-300 ease-out pointer-events-none"
                                style={{
                                    width: `calc(${itemWidth}% - 8px)`,
                                    left:  `calc(${activeIndex * itemWidth}% + 4px)`,
                                }}
                            />
                        );
                    }
                    return null;
                })()}

                {/* Nav items grid */}
                <div
                    className="relative grid h-[60px]"
                    style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
                >
                    {visibleItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = optimisticPath === item.href ||
                            (item.href !== "/dashboard" && item.href !== "/profile" && optimisticPath.startsWith(item.href + "/"));
                        const isCenter = item.isCenter;

                        // ── Center tab (Courses) — elevated circular style ──
                        if (isCenter) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => handleNavClick(item.href)}
                                    className="relative z-10 flex flex-col items-center justify-center gap-0.5 active:scale-90 touch-manipulation"
                                    style={{ WebkitTapHighlightColor: "transparent" }}
                                >
                                    {/* Elevated circle — always visible, active = filled */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 -mt-5",
                                        isActive
                                            ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-400/40 scale-110"
                                            : "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/60 dark:to-purple-900/60 shadow-violet-200/50 dark:shadow-violet-900/50"
                                    )}>
                                        <Icon className={cn(
                                            "h-5 w-5 transition-colors duration-300",
                                            isActive ? "text-white" : "text-violet-500 dark:text-violet-400"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-semibold leading-none transition-colors duration-200 -mt-0.5",
                                        isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }

                        // ── Regular tabs ──
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                    "relative z-10 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 touch-manipulation rounded-xl",
                                    isActive
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-slate-400 dark:text-slate-500"
                                )}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                <Icon className={cn(
                                    "transition-all duration-200",
                                    isActive ? "h-[22px] w-[22px]" : "h-5 w-5"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium leading-none transition-all duration-200",
                                    isActive && "font-semibold"
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
