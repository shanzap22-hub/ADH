import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InstructorClientLayout from "@/components/dashboard/InstructorClientLayout";

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

    const is_super_admin = profile.role === 'super_admin';

    // Client Component wrapper handles sidebar visibility logic
    return (
        <InstructorClientLayout is_super_admin={is_super_admin}>
            {children}
        </InstructorClientLayout>
    );
}
