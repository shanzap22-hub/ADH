import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock } from "lucide-react";

export default function AdminAuditLogsPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600 mt-1">Track all admin actions and system events</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Audit logging coming soon!</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Track admin actions, user changes, and system events
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Example of what audit logs will look like */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Recent Activity (Preview)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Role Changed</p>
                                <p className="text-xs text-gray-500">Admin changed user role from student to instructor</p>
                            </div>
                            <span className="text-xs text-gray-400">2 hours ago</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Course Published</p>
                                <p className="text-xs text-gray-500">Admin published course "Advanced Web Development"</p>
                            </div>
                            <span className="text-xs text-gray-400">5 hours ago</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
