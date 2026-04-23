"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StudentSidebar } from "./StudentSidebar";

interface StudentMobileSidebarProps {
    is_instructor?: boolean;
    is_super_admin?: boolean;
    permissions: {
        canViewCommunity: boolean;
        canViewLive: boolean;
        canViewChat: boolean;
    };
}

export const StudentMobileSidebar = ({ is_instructor, is_super_admin, permissions }: StudentMobileSidebarProps) => {
    return (
        <Sheet>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition" suppressHydrationWarning>
                <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-secondary" suppressHydrationWarning>
                <StudentSidebar is_instructor={is_instructor} is_super_admin={is_super_admin} permissions={permissions} />
            </SheetContent>
        </Sheet>
    )
}
