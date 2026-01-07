import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
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

    // Check user role - ONLY super_admin can access admin routes
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, email, full_name')
        .eq('id', user.id)
        .single();

    // Redirect non-super-admins to their appropriate dashboard
    if (!profile || profile.role !== 'super_admin') {
        if (profile?.role === 'instructor') {
            redirect("/instructor/courses");
        } else {
            redirect("/dashboard");
        }
    }

    return (
        <div className="h-full">
            <div className="h-[80px] md:pl-64 fixed inset-y-0 w-full z-50">
                <div className="p-4 border-b h-full flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="md:hidden">
                            {/* Mobile menu button */}
                        </div>
                        <div className="text-white">
                            <h1 className="text-xl font-bold">Super Admin Dashboard</h1>
                            <p className="text-xs text-purple-100">{profile.email}</p>
                        </div>
                    </div>
                    <div className="flex w-full justify-end">
                        <div className="bg-purple-500/30 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Super Admin
                        </div>
                    </div>
                </div>
            </div>
            <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50 bg-gradient-to-b from-purple-50 to-indigo-50 border-r">
                <AdminSidebar />
            </div>
            <main className="md:pl-64 pt-[80px] h-full bg-gray-50">
                {children}
            </main>
        </div>
    );
}
