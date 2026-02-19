"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    BarChart3,
    FileText,
    Settings,
    ArrowLeftRight,
    Tag, // Imported Tag
    Brain,
    PenTool,
    Link as LinkIcon,
    Bell,
} from "lucide-react";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin",
        color: "text-purple-600",
    },
    {
        label: "Transactions",
        icon: ArrowLeftRight,
        href: "/admin/transactions",
        color: "text-green-600",
    },
    {
        label: "Coupons",
        icon: Tag,
        href: "/admin/coupons",
        color: "text-pink-600",
    },
    {
        label: "All Courses",
        icon: BookOpen,
        href: "/instructor/courses",
        color: "text-indigo-600",
    },
    {
        label: "Master Notes",
        icon: FileText,
        href: "/instructor/notes",
        color: "text-emerald-600",
    },
    {
        label: "User Management",
        icon: Users,
        href: "/admin/users",
        color: "text-blue-600",
    },
    {
        label: "Course Tiers",
        icon: Settings,
        href: "/admin/course-tiers",
        color: "text-purple-600",
    },
    {
        label: "Analytics",
        icon: BarChart3,
        href: "/admin/analytics",
        color: "text-green-600",
    },
    {
        label: "Audit Logs",
        icon: FileText,
        href: "/admin/audit-logs",
        color: "text-orange-600",
    },
    {
        label: "AI Knowledge Base",
        icon: Brain,
        href: "/admin/knowledge",
        color: "text-violet-600",
    },
    {
        label: "Blog / SEO",
        icon: PenTool,
        href: "/admin/blog",
        color: "text-pink-500",
    },
    {
        label: "Short Links",
        icon: LinkIcon,
        href: "/admin/redirects",
        color: "text-orange-500",
    },
    {
        label: "Push Notifications",
        icon: Bell,
        href: "/admin/notifications",
        color: "text-red-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/admin/settings",
        color: "text-gray-600",
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [optimisticPath, setOptimisticPath] = useState(pathname);

    useEffect(() => {
        setOptimisticPath(pathname);
    }, [pathname]);

    const handleNavClick = (href: string) => {
        setOptimisticPath(href);
    };

    return (
        <div className="space-y-4 py-4 flex flex-col h-full">
            <div className="px-3 py-2 flex-1">
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => handleNavClick(route.href)}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-white/50 rounded-lg transition",
                                optimisticPath === route.href || (route.href !== '/admin' && optimisticPath?.startsWith(route.href + "/"))
                                    ? "bg-white shadow-sm"
                                    : "transparent"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon
                                    className={cn("h-5 w-5 mr-3", route.color)}
                                />
                                <span className="text-gray-700">{route.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Role Switcher */}
            <div className="px-3 py-2 border-t">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-3">
                    SWITCH ROLE
                </div>
                <Link
                    href="/instructor/courses"
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-white/50 rounded-lg transition"
                >
                    <div className="flex items-center flex-1">
                        <ArrowLeftRight className="h-5 w-5 mr-3 text-blue-600" />
                        <span className="text-gray-700">Instructor Mode</span>
                    </div>
                </Link>
                <Link
                    href="/dashboard"
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-white/50 rounded-lg transition"
                >
                    <div className="flex items-center flex-1">
                        <ArrowLeftRight className="h-5 w-5 mr-3 text-green-600" />
                        <span className="text-gray-700">Student Mode</span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
