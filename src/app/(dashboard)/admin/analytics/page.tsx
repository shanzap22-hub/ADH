import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";

export default async function AdminAnalyticsPage() {
    const supabase = await createClient();

    // Get analytics data
    const [
        { count: totalUsers },
        { count: totalCourses },
        { count: totalEnrollments },
        { count: publishedCourses },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
                <p className="text-gray-600 mt-1">View platform-wide statistics and growth</p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">All platform users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCourses || 0}</div>
                        <p className="text-xs text-muted-foreground">{publishedCourses || 0} published</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments || 0}</div>
                        <p className="text-xs text-muted-foreground">Course enrollments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Enrollment</CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalCourses && totalCourses > 0
                                ? Math.round((totalEnrollments || 0) / totalCourses)
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Per course</p>
                    </CardContent>
                </Card>
            </div>

            {/* Coming Soon */}
            <Card>
                <CardHeader>
                    <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Charts and graphs coming soon!</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Growth trends, user activity, and revenue analytics
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
