import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { StudentMobileSidebar } from "@/components/dashboard/StudentMobileSidebar";

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full">
            <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
                <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                    <StudentMobileSidebar />
                    <div className="flex w-full justify-end">
                        {/* UserButton / Actions */}
                    </div>
                </div>
            </div>
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
                <StudentSidebar />
            </div>
            <main className="md:pl-56 pt-[80px] h-full">
                {children}
            </main>
        </div>
    );
}
