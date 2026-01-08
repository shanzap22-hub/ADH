import { getAllUsers } from "@/actions/admin/get-all-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRoleSelector } from "@/components/admin/UserRoleSelector";
import { UserTierSelector } from "@/components/admin/UserTierSelector";
import { MembershipBadge } from "@/components/membership/MembershipBadge";
import { Users, Mail, Calendar } from "lucide-react";

export default async function AdminUsersPage() {
    const users = await getAllUsers();

    const studentCount = users.filter(u => u.role === 'student').length;
    const instructorCount = users.filter(u => u.role === 'instructor').length;
    const adminCount = users.filter(u => u.role === 'super_admin').length;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage all users, their roles, and membership tiers</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{studentCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Instructors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{instructorCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Super Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{adminCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-gray-900">
                                            {user.full_name || 'No name'}
                                        </h3>
                                        <Badge
                                            variant={
                                                user.role === 'super_admin' ? 'destructive' :
                                                    user.role === 'instructor' ? 'default' :
                                                        'secondary'
                                            }
                                        >
                                            {user.role}
                                        </Badge>
                                        <MembershipBadge tier={user.membership_tier || 'bronze'} size="sm" />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            <span>{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Role</div>
                                        <UserRoleSelector userId={user.id} currentRole={user.role} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Membership Tier</div>
                                        <UserTierSelector userId={user.id} currentTier={user.membership_tier || 'bronze'} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
