"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Video, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetaballLoader } from "@/components/ui/metaball-loader";

const navItems = [
    { label: "Home",    icon: Home,          href: "/dashboard" },
    { label: "Courses", icon: BookOpen,       href: "/courses"   },
    { label: "Live",    icon: Video,          href: "/live"      },
    { label: "Chat",    icon: MessageCircle,  href: "/chat"      },
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

    // Hide on Course Player pages
    const isChapterPage = pathname.includes("/chapters/");
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

    const activeIndex = visibleNavItems.findIndex(item =>
        optimisticPath === item.href ||
        (item.href !== "/dashboard" && optimisticPath.startsWith(item.href + "/"))
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none pb-[env(safe-area-inset-bottom)]">
            {/* Loading overlay */}
            <MetaballLoader
                fullscreen
                className={cn(
                    "transition-opacity duration-500",
                    isNavigating ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Glass nav bar */}
            <div className="mx-3 mb-3 rounded-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">

                {/* Active pill indicator */}
                <div
                    className="absolute top-2 h-[calc(100%-16px)] transition-all duration-300 ease-out pointer-events-none z-0"
                    style={{
                        width: `calc(${100 / visibleNavItems.length}% - 12px)`,
                        transform: `translateX(calc(${Math.max(0, activeIndex) * 100}% + ${Math.max(0, activeIndex) * 0}px + 6px))`,
                        opacity: activeIndex === -1 ? 0 : 1,
                    }}
                >
                    <div className="h-full w-full rounded-xl bg-violet-50 dark:bg-violet-950/50" />
                </div>

                <div
                    className="relative grid h-16"
                    style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}
                >
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = optimisticPath === item.href ||
                            (item.href !== "/dashboard" && optimisticPath.startsWith(item.href + "/"));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                    "relative z-10 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 touch-manipulation",
                                    isActive
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                <Icon className={cn(
                                    "h-5 w-5 transition-all duration-200",
                                    isActive && "scale-110"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium transition-all duration-200",
                                    isActive && "font-semibold"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Active indicator line at top of nav */}
            <div
                className="absolute top-0 left-3 right-3 h-0.5 pointer-events-none overflow-hidden rounded-full"
                style={{ display: "none" }}
            />
        </nav>
    );
};
