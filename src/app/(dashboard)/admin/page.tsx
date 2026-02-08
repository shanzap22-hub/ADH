import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Shield } from "lucide-react";
import { redirect } from "next/navigation";

// 2026 Performance: 2-minute cache for admin pages
export const revalidate = 120;

export default async function AdminPage() {
    const supabase = await createClient();

    // Get platform statistics
    const [
        { count: totalStudents },
        { count: totalInstructors },
        { count: totalAdmins },
        { count: totalCourses },
        { count: publishedCourses },
        { count: totalEnrollments },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    ]);

    const stats = [
        {
            title: "Total Students",
            value: totalStudents || 0,
            icon: Users,
            color: "bg-blue-500",
        },
        {
            title: "Total Instructors",
            value: totalInstructors || 0,
            icon: GraduationCap,
            color: "bg-green-500",
        },
        {
            title: "Total Courses",
            value: totalCourses || 0,
            icon: BookOpen,
            color: "bg-purple-500",
        },
        {
            title: "Published Courses",
            value: publishedCourses || 0,
            icon: BookOpen,
            color: "bg-indigo-500",
        },
        {
            title: "Total Enrollments",
            value: totalEnrollments || 0,
            icon: Users,
            color: "bg-orange-500",
        },
        {
            title: "Super Admins",
            value: totalAdmins || 0,
            icon: Shield,
            color: "bg-red-500",
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Super Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your entire platform from here</p>
            </div>

            {/* Statistics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.color} p-2 rounded-lg`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition cursor-pointer">
                    <CardHeader>
                        <CardTitle className="text-lg">Manage Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            View, edit, and delete all courses from all instructors
                        </p>
                        <a href="/admin/courses" className="text-purple-600 text-sm font-medium mt-2 inline-block">
                            Go to Courses →
                        </a>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition cursor-pointer">
                    <CardHeader>
                        <CardTitle className="text-lg">Manage Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            View all users and change their roles
                        </p>
                        <a href="/admin/users" className="text-purple-600 text-sm font-medium mt-2 inline-block">
                            Go to Users →
                        </a>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition cursor-pointer">
                    <CardHeader>
                        <CardTitle className="text-lg">View Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            See platform-wide statistics and growth
                        </p>
                        <a href="/admin/analytics" className="text-purple-600 text-sm font-medium mt-2 inline-block">
                            Go to Analytics →
                        </a>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition cursor-pointer">
                    <CardHeader>
                        <CardTitle className="text-lg">Manage Coupons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Create and track discount codes
                        </p>
                        <a href="/admin/coupons" className="text-purple-600 text-sm font-medium mt-2 inline-block">
                            Go to Coupons →
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
