import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, Trash2 } from "lucide-react";
import { DeleteUserButton } from "./_components/delete-user-button";

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Get all users with their profiles
    const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[STUDENTS_PAGE]", error);
    }

    // Get purchase counts for each user
    const { data: purchases } = await supabase
        .from("purchases")
        .select("user_id, course_id");

    const purchaseCountByUser = purchases?.reduce((acc: any, purchase) => {
        acc[purchase.user_id] = (acc[purchase.user_id] || 0) + 1;
        return acc;
    }, {}) || {};

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                    Student Management
                </h1>
                <p className="text-slate-400 mt-1">Manage all registered users</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm border border-blue-500/20 p-6">
                    <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Students</p>
                            <p className="text-3xl font-bold text-white">{users?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Students
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/70 border-slate-700">
                                    <TableHead className="text-slate-300">Name</TableHead>
                                    <TableHead className="text-slate-300">Email</TableHead>
                                    <TableHead className="text-slate-300">Role</TableHead>
                                    <TableHead className="text-slate-300">Courses</TableHead>
                                    <TableHead className="text-slate-300">Joined</TableHead>
                                    <TableHead className="text-slate-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users && users.length > 0 ? (
                                    users.map((student) => (
                                        <TableRow key={student.id} className="border-slate-700/50 hover:bg-slate-800/30">
                                            <TableCell className="font-medium text-white">
                                                {student.full_name || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-slate-400 flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                {student.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={student.role === "instructor" ? "default" : "secondary"}>
                                                    {student.role || "student"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400">
                                                {purchaseCountByUser[student.id] || 0} courses
                                            </TableCell>
                                            <TableCell className="text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(student.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DeleteUserButton userId={student.id} userName={student.full_name || student.email} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                            No students found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
