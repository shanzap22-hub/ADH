"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
    {
        label: "Feed",
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
        label: "Profile",
        icon: User,
        href: "/profile",
    },
];

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-50">
            <div
                className="grid h-16"
                style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                                isActive
                                    ? "text-orange-500"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
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

            {/* Active indicator line */}
            <div
                className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                style={{
                    width: `${100 / navItems.length}%`,
                    transform: `translateX(${navItems.findIndex(item => pathname === item.href || pathname.startsWith(item.href + "/")) * 100}%)`,
                }}
            />
        </nav>
    );
};
