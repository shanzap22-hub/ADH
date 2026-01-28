"use client";

import Link from "next/link";
import { LayoutDashboard, Compass, BookOpen, Video, MessageSquare, Users, User, LogOut, Shield, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-slate-500",
    },

    {
        label: "My Learning",
        icon: BookOpen,
        href: "/courses",
        color: "text-slate-500",
    },
    {
        label: "Live Class",
        icon: Video,
        href: "/live",
        color: "text-slate-500",
    },
    {
        label: "AI Mentor",
        icon: MessageSquare,
        href: "/chat",
        color: "text-slate-500",
    },
    {
        label: "Community",
        icon: Users,
        href: "/community",
        color: "text-slate-500",
    },
    {
        label: "Profile",
        icon: User,
        href: "/profile",
        color: "text-slate-500",
    },
];

interface StudentSidebarProps {
    is_instructor?: boolean;
    is_super_admin?: boolean;
}

export const StudentSidebar = ({ is_instructor, is_super_admin }: StudentSidebarProps) => {
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
                <h2 className="text-xl font-semibold">Student Dashboard</h2>
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

                {/* Spacer */}
                <div className="flex-1" />

                {/* Admin Mode (if user is super_admin) */}
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

                {/* Instructor Mode (if user is instructor) */}
                {is_instructor && (
                    <div className={cn("p-6", is_super_admin && "pt-0", !is_super_admin && "border-t")}>
                        <Link href="/instructor/courses">
                            <Button variant="outline" className="w-full" size="sm">
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Instructor Mode
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Logout Button */}
                <div className={cn("p-6", (is_instructor || is_super_admin) && "pt-0")}>
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
