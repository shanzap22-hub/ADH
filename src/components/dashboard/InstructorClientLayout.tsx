"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { cn } from "@/lib/utils";

interface InstructorClientLayoutProps {
    children: React.ReactNode;
    is_super_admin: boolean;
}

export default function InstructorClientLayout({
    children,
    is_super_admin
}: InstructorClientLayoutProps) {
    const pathname = usePathname();

    // Check if we are in the Mind Map Editor (e.g., /instructor/mind-maps/some-uuid)
    // We want to keep the sidebar on the list page (/instructor/mind-maps) but hide it on the detail page.
    const isMindMapEditor = pathname?.includes("/instructor/mind-maps/") && pathname.split("/").length > 3;

    return (
        <div className="h-full">
            {!isMindMapEditor && (
                <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50 md:hidden">
                    <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                        <MobileSidebar />
                        <div className="flex w-full justify-end">
                            {/* UserButton / Profile placeholder */}
                        </div>
                    </div>
                </div>
            )}

            {!isMindMapEditor && (
                <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
                    <Sidebar is_super_admin={is_super_admin} />
                </div>
            )}

            <main className={cn(
                "h-full",
                !isMindMapEditor ? "md:pl-56 pt-[80px] md:pt-0" : "" // Remove padding if editor
            )}>
                {children}
            </main>
        </div>
    );
}
