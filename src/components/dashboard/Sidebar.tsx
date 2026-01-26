"use client";

import Image from "next/image";

import Link from "next/link";
import { LayoutDashboard, Compass, Radio, Users, Settings, Eye, UserPlus, LogOut, Shield, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const routes = [
    {
        label: "Courses",
        icon: Compass,
        href: "/instructor/courses",
        color: "text-sky-500",
    },
    {
        label: "Community",
        icon: Users,
        href: "/instructor/community",
        color: "text-indigo-500",
    },
    {
        label: "Live Manager",
        icon: Radio,
        href: "/instructor/live-manager",
        color: "text-red-500",
    },
    {
        label: "Availability",
        icon: Clock,
        href: "/instructor/availability",
        color: "text-orange-500",
    },
    {
        label: "Enroll Students",
        icon: UserPlus,
        href: "/instructor/enroll",
        color: "text-emerald-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/instructor/settings",
    },
];

interface SidebarProps {
    is_super_admin?: boolean;
}

export const Sidebar = ({ is_super_admin }: SidebarProps) => {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
            <div className="p-6">
                <div className="flex items-center justify-center">
                    <Image
                        src="/logo.png"
                        alt="ADH Connect"
                        width={150}
                        height={40}
                        className="h-20 w-auto object-contain"
                        priority
                    />
                </div>
            </div>
            <div className="flex flex-col w-full flex-1">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-x-2 text-slate-500 text-sm font-[500] pl-6 transition-all hover:text-slate-600 hover:bg-slate-300/20",
                            route.color
                        )}
                    >
                        <div className="flex items-center gap-x-2 py-4">
                            <route.icon size={22} />
                            {route.label}
                        </div>
                    </Link>
                ))}

                {/* Spacer to push logout to bottom */}
                <div className="flex-1" />

                {/* Admin Mode Button (if user is super_admin) */}
                {is_super_admin && (
                    <div className="p-6 border-t">
                        <Link href="/admin">
                            <Button variant="outline" className="w-full" size="sm">
                                <Shield className="h-4 w-4 mr-2" />
                                Admin Mode
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Student Mode Button */}
                <div className={cn("p-6", is_super_admin && "pt-0", !is_super_admin && "border-t")}>
                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Student Mode
                        </Button>
                    </Link>
                </div>

                {/* Logout Button */}
                <div className={cn("p-6 pt-0")}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        size="sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};
