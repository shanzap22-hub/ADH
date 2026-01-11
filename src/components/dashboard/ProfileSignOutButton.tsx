"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const ProfileSignOutButton = () => {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login");
        }
    };

    return (
        <Button
            onClick={handleSignOut}
            className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
            Sign Out
        </Button>
    );
};
