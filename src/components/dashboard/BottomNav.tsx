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
    const isPlayerPage  = isChapterPage || pathname.includes("/learn");

    if (permissions?.hideOnPlayer && isPlayerPage) return null;

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

    const itemCount  = visibleNavItems.length;
    const itemWidth  = 100 / itemCount; // % width per item

    return (
        <>
            {/* Loading overlay */}
            <MetaballLoader
                fullscreen
                className={cn(
                    "transition-opacity duration-500 pointer-events-none",
                    isNavigating ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Bottom Nav */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                {/* Floating glass container */}
                <div className="mx-3 mb-3 relative rounded-2xl bg-white/95 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xl shadow-black/10 dark:shadow-black/50">

                    {/* Sliding active pill — sits behind the icons */}
                    {activeIndex !== -1 && (
                        <div
                            className="absolute top-1.5 bottom-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 transition-all duration-300 ease-out pointer-events-none"
                            style={{
                                width:  `calc(${itemWidth}% - 8px)`,
                                left:   `calc(${activeIndex * itemWidth}% + 4px)`,
                            }}
                        />
                    )}

                    {/* Nav items */}
                    <div
                        className="relative grid h-[60px]"
                        style={{ gridTemplateColumns: `repeat(${itemCount}, minmax(0, 1fr))` }}
                    >
                        {visibleNavItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = index === activeIndex;

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
        </>
    );
};
