import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WeeklyLiveManager } from "@/components/instructor/WeeklyLiveManager";

export default async function LiveManagerPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "instructor" && profile?.role !== "super_admin" && profile?.role !== 'admin') {
        return redirect("/");
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Live Session Manager</h1>
            <div className="max-w-3xl">
                <WeeklyLiveManager />
            </div>
        </div>
    );
}
