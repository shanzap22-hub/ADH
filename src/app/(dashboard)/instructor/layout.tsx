import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Navbar } from "@/components/landing/Navbar";

export default async function InstructorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Check user role - only instructors and super admins can access instructor routes
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // Redirect students to their dashboard
    if (!profile || (profile.role !== 'instructor' && profile.role !== 'super_admin')) {
        redirect("/dashboard");
    }

    return (
        <div className="h-full">
            <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
                {/* Dashboard specific navbar could go here, for now using simple header or just mobile sidebar trigger */}
                <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                    <MobileSidebar />
                    <div className="flex w-full justify-end">
                        {/* UserButton / Profile would go here */}
                    </div>
                </div>
            </div>
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
                <Sidebar />
            </div>
            <main className="md:pl-56 pt-[80px] h-full">
                {children}
            </main>
        </div>
    );
}
