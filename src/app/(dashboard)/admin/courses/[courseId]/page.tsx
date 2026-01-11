import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Users, DollarSign, LayoutDashboard, FileVideo } from "lucide-react";
import Link from "next/link";

export default async function AdminCourseIdPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params;
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') redirect("/dashboard");

    // Fetch Course Details
    const { data: course } = await supabase
        .from("courses")
        .select(`
            *,
            chapters:chapters(id, title, is_published, position),
            attachments:attachments(id, name),
            purchases:purchases(count)
        `)
        .eq("id", courseId)
        .single();

    if (!course) {
        return <div>Course not found</div>;
    }

    // Get enrollment count correctly (Supabase returns count as array of objects if request simple count?)
    // Actually using `select(..., { count: 'exact' })` is better but here we used dot notation assuming Supabase handles it.
    // If specific count query needed:
    const { count: enrollmentCount } = await supabase
        .from("purchases")
        .select("*", { count: 'exact', head: true })
        .eq("course_id", courseId);

    return (
        <div className="p-6">
            <div className="flex items-center gap-x-4 mb-6">
                <Link href="/admin/courses" className="flex items-center text-sm hover:opacity-75 transition">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to all courses
                </Link>
            </div>

            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-y-2">
                    <h1 className="text-2xl font-bold">
                        {course.title}
                    </h1>
                    <div className="flex items-center gap-x-2">
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                            {course.is_published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-sm text-slate-500">
                            Created on {new Date(course.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Admin Actions */}
                    <Link href={`/instructor/courses/${courseId}`}>
                        <Button variant="outline">
                            Edit as Instructor
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{enrollmentCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course.chapters?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Price</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {course.price ? `₹${course.price}` : "Free"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Chapters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {course.chapters?.sort((a: any, b: any) => a.position - b.position).map((chapter: any) => (
                                <div key={chapter.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                                    <div className="flex items-center gap-x-2">
                                        <FileVideo className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium text-sm">{chapter.title}</span>
                                    </div>
                                    <Badge variant={chapter.is_published ? "outline" : "secondary"}>
                                        {chapter.is_published ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                            ))}
                            {(!course.chapters || course.chapters.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No chapters found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {course.description || "No description provided."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
