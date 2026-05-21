"use client";

import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { StudentMobileSidebar } from "@/components/dashboard/StudentMobileSidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface StudentDashboardLayoutContentProps {
    children: React.ReactNode;
    is_instructor: boolean;
    is_super_admin: boolean;
    permissions: {
        canViewCommunity: boolean;
        canViewLive: boolean;
        canViewChat: boolean;
    };
}

export const StudentDashboardLayoutContent = ({
    children,
    is_instructor,
    is_super_admin,
    permissions
}: StudentDashboardLayoutContentProps) => {
    const pathname = usePathname();
    const isChat = pathname === '/chat' || pathname.startsWith('/chat/');

    return (
        <div className="h-full">
            {/* Top Navigation Header - Hidden on mobile/tablet Chat, Visible on lg+ desktop */}
            <div className={isChat ? "hidden lg:block" : ""}>
                <TopHeader />
            </div>

            {/* Desktop Sidebar - ടാബ്‌ലെറ്റ് Chat page-ൽ hide ചെയ്യുക (lg: breakpoint) */}
            <div className={cn(
                "hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-[calc(4rem_+_env(safe-area-inset-top))]",
                isChat && "md:hidden lg:flex"
            )}>
                <StudentSidebar
                    is_instructor={is_instructor}
                    is_super_admin={is_super_admin}
                    permissions={permissions}
                />
            </div>

            {/* Main Content Area */}
            {/* Chat page: ടാബ്‌ലെറ്റിൽ sidebar ഇല്ലാതെ full width, lg+-ൽ sidebar padding */}
            <main className={cn(
                "h-full",
                isChat
                    ? "pb-16 lg:pb-0 lg:pl-56 lg:pt-[calc(4rem_+_env(safe-area-inset-top))]"
                    : "md:pl-56 pt-[calc(4rem_+_env(safe-area-inset-top))] pb-16 md:pb-0"
            )}>
                {children}
            </main>

            {/* Bottom Navigation - Always Visible */}
            <BottomNav permissions={permissions} />
        </div>
    );
};
