import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DollarSign, Users, BookOpen, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Get all courses for this instructor
    const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);

    const totalCourses = courses?.length || 0;

    // Get all purchases for instructor's courses
    const { data: purchases } = await supabase
        .from("purchases")
        .select("user_id, course_id")
        .in("course_id", courses?.map(c => c.id) || []);

    const totalSales = purchases?.length || 0;

    // Calculate revenue (₹4999 per sale)
    const totalRevenue = totalSales * 4999;

    // Get unique students
    const uniqueStudents = new Set(purchases?.map(p => p.user_id) || []).size;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                    Analytics Overview
                </h1>
                <p className="text-slate-400 mt-1">Track your performance and revenue</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Revenue</p>
                            <p className="text-3xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Sales</p>
                            <p className="text-3xl font-bold text-white">{totalSales}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Students</p>
                            <p className="text-3xl font-bold text-white">{uniqueStudents}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm border border-orange-500/20 p-6 hover:border-orange-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Courses</p>
                            <p className="text-3xl font-bold text-white">{totalCourses}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
