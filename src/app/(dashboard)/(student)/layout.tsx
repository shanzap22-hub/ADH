import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { StudentMobileSidebar } from "@/components/dashboard/StudentMobileSidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopHeader } from "@/components/dashboard/TopHeader";

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full">
            {/* Top Navigation Header */}
            <TopHeader />

            <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-40 mt-16">
                <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                    <StudentMobileSidebar />
                    <div className="flex w-full justify-end">
                        {/* UserButton / Actions */}
                    </div>
                </div>
            </div>
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-16">
                <StudentSidebar />
            </div>
            <main className="md:pl-56 pt-[144px] pb-16 md:pb-0 h-full">
                {children}
            </main>
            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />
        </div>
    );
}
