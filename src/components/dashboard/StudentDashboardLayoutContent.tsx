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
            {/* Top Navigation Header - Always Visible */}
            <TopHeader />

            {/* Mobile Sidebar Trigger Bar - Hidden on Chat */}
            {!isChat && (
                <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-40 mt-16">
                    <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                        <StudentMobileSidebar />
                        <div className="flex w-full justify-end">
                            {/* UserButton / Actions */}
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-16">
                <StudentSidebar is_instructor={is_instructor} is_super_admin={is_super_admin} />
            </div>

            {/* Main Content Area */}
            {/* Adjustable padding: 144px (normal) or 64px (chat - header only) */}
            <main className={cn(
                "md:pl-56 h-full",
                isChat ? "pt-16 pb-0" : "pt-[144px] pb-16 md:pb-0"
            )}>
                {children}
            </main>

            {/* Bottom Navigation - Hidden on Chat to give full height */}
            {!isChat && <BottomNav />}
        </div>
    );
};
