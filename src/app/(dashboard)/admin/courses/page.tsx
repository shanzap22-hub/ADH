import { getAllCourses } from "@/actions/admin/get-all-courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, User, Calendar } from "lucide-react";

// 2026 Performance: 2-minute cache for admin pages
export const revalidate = 120;
export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
    const courses = await getAllCourses();

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
                    <p className="text-gray-600 mt-1">Manage all courses from all instructors</p>
                </div>
                <div className="text-sm text-gray-600">
                    Total: <span className="font-bold text-purple-600">{courses.length}</span> courses
                </div>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">No courses found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg line-clamp-2">
                                        {course.title}
                                    </CardTitle>
                                    <Badge variant={course.is_published ? "default" : "secondary"}>
                                        {course.is_published ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {course.description || "No description"}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="h-4 w-4" />
                                    <span className="truncate">{course.instructor_email}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{course.chapter_count} chapters</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(course.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="pt-2 border-t">
                                    <Link
                                        href={`/instructor/courses/${course.id}`}
                                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                    >
                                        View/Edit Course →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
