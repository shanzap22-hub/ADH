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
}

export const StudentDashboardLayoutContent = ({
    children,
    is_instructor,
    is_super_admin
}: StudentDashboardLayoutContentProps) => {
    const pathname = usePathname();
    const isChat = pathname === '/chat' || pathname.startsWith('/chat/');

    return (
        <div className="h-full">
            {/* Top Navigation Header - Hidden on Chat Page for Full Screen */}
            {!isChat && <TopHeader />}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-16">
                <StudentSidebar is_instructor={is_instructor} is_super_admin={is_super_admin} />
            </div>

            {/* Main Content Area */}
            {/* Remove padding on Chat page to allow fixed chat container to fill top */}
            <main className={cn(
                "md:pl-56 h-full",
                isChat ? "pb-16 md:pb-0" : "pt-16 pb-16 md:pb-0"
            )}>
                {children}
            </main>

            {/* Bottom Navigation - Always Visible */}
            <BottomNav />
        </div>
    );
};
