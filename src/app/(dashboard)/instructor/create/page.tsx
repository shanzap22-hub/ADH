import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateCourseForm from "./CreateCourseForm";

export default async function CreateCoursePage() {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Check user role - only instructors and super admins can create courses
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'instructor' && profile.role !== 'super_admin')) {
        // Students cannot create courses - redirect to dashboard
        redirect("/dashboard");
    }

    return <CreateCourseForm />;
}
