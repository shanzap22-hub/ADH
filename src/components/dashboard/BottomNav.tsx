"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Video, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MetaballLoader } from "@/components/ui/metaball-loader";

const navItems = [
    {
        label: "Home",
        icon: Home,
        href: "/dashboard",
    },
    {
        label: "Courses",
        icon: BookOpen,
        href: "/courses",
    },
    {
        label: "Live",
        icon: Video,
        href: "/live",
    },
    {
        label: "Chat",
        icon: MessageCircle,
        href: "/chat",
    },
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
    const [isNavigating, setIsNavigating] = useState(false);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setOptimisticPath(pathname);
        setIsNavigating(false);
    }

    const handleNavClick = (href: string) => {
        if (href !== pathname) {
            setOptimisticPath(href);
            setIsNavigating(true);
        }
    };

    // Hide on Course Player (Chapters) pages if requested (default to false to avoid breaking other layouts)
    const isChapterPage = pathname.includes("/chapters/");

    // Also check for "learn" if that's used, but based on file structure it's chapters.
    // However, if the user mentioned "learn/page.tsx" in history, I should double check. 
    // The previous history mentions learn/page.tsx. Let's cover that too just in case.
    const isPlayerPage = isChapterPage || pathname.includes("/learn");

    if (permissions?.hideOnPlayer && isPlayerPage) {
        return null;
    }

    const visibleNavItems = navItems.filter((item) => {
        if (item.href === "/live" && permissions && !permissions.canViewLive) return false;
        if (item.href === "/chat" && permissions && !permissions.canViewChat) return false;
        return true;
    });

    if (visibleNavItems.length === 0) return null;

    // Use optimistic path for active state to give instant feedback
    const activeIndex = visibleNavItems.findIndex(item => optimisticPath === item.href || (item.href !== '/dashboard' && optimisticPath.startsWith(item.href + "/")));

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-50 select-none pb-[env(safe-area-inset-bottom)]">
            {/* Premium Minimal Metaball Loading Animation */}
            <MetaballLoader
                fullscreen
                className={cn(
                    "transition-opacity duration-500",
                    isNavigating ? "opacity-100" : "opacity-0"
                )}
            />

            <div
                className="grid h-16"
                style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}
            >
                {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = optimisticPath === item.href || (item.href !== '/dashboard' && optimisticPath.startsWith(item.href + "/"));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => handleNavClick(item.href)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 touch-manipulation",
                                isActive
                                    ? "text-orange-500"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    isActive && "scale-110"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-medium transition-all duration-200",
                                    isActive && "font-semibold"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Active indicator line (Bottom) */}
            <div
                className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300 ease-out"
                style={{
                    width: `${100 / visibleNavItems.length}%`,
                    transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
                    opacity: activeIndex === -1 ? 0 : 1
                }}
            />
        </nav>
    );
};
