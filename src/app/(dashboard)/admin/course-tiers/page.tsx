import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import { CourseTierManager } from "@/components/admin/CourseTierManager";

export default async function CourseTiersPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        return redirect("/");
    }

    // Check if user is super admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "super_admin") {
        return redirect("/dashboard");
    }

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select(`
            id,
            title,
            description,
            is_published,
            created_at
        `)
        .order("created_at", { ascending: false });

    // Fetch current tier assignments
    const { data: tierAssignments, error: tierError } = await supabase
        .from("course_tier_access")
        .select("course_id, tier");

    // Fetch tier pricing info
    const { data: tierPricing, error: pricingError } = await supabase
        .from("tier_pricing")
        .select("*")
        .order("price", { ascending: true });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Course Tier Management</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Assign courses to membership tiers
                    </p>
                </div>
            </div>

            {/* Tier Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {tierPricing?.map((tier) => (
                    <div
                        key={tier.tier}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                        <div className="text-lg font-bold capitalize">{tier.name}</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {tier.price === 0 ? "Free" : `₹${tier.price.toLocaleString("en-IN")}`}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {tier.max_courses === 999 ? "All courses" : `${tier.max_courses} courses`}
                        </div>
                    </div>
                ))}
            </div>

            {/* Course Tier Manager */}
            <CourseTierManager
                courses={courses || []}
                tierAssignments={tierAssignments || []}
            />
        </div>
    );
}
