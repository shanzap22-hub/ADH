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
            {/* Top Navigation Header - Hidden on MOBILE Chat Page, Visible on Desktop */}
            <div className={isChat ? "hidden md:block" : ""}>
                <TopHeader />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-[calc(4rem_+_env(safe-area-inset-top))]">
                <StudentSidebar
                    is_instructor={is_instructor}
                    is_super_admin={is_super_admin}
                    permissions={permissions}
                />
            </div>

            {/* Main Content Area */}
            {/* Remove padding on Chat page (Mobile) to allow fixed chat container to fill top 
                But add padding back on Desktop (md:pt-16) because Header is visible there */}
            <main className={cn(
                "md:pl-56 h-full",
                isChat
                    ? "pb-16 md:pb-0 md:pt-[calc(4rem_+_env(safe-area-inset-top))]"
                    : "pt-[calc(4rem_+_env(safe-area-inset-top))] pb-16 md:pb-0"
            )}>
                {children}
            </main>

            {/* Bottom Navigation - Always Visible */}
            <BottomNav permissions={permissions} />
        </div>
    );
};
