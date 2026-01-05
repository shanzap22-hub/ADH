"use client";

import { TopHeader } from "./TopHeader";
import { BottomNav } from "./BottomNav";

interface MobileLayoutProps {
    children: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Header - Fixed */}
            <TopHeader />

            {/* Main Content - Scrollable */}
            <main className="pt-16 pb-20 md:pb-6">
                <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-4rem)]">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation - Fixed on Mobile */}
            <BottomNav />
        </div>
    );
};
