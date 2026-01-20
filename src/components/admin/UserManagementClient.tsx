"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Users, Search, Filter, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Import existing editor components
import { UserRoleSelector } from "@/components/admin/UserRoleSelector";
import { UserTierSelector } from "@/components/admin/UserTierSelector";
import { UserPhoneEditor } from "@/components/admin/UserPhoneEditor";
import { UserEmailEditor } from "@/components/admin/UserEmailEditor";
import { UserNameEditor } from "@/components/admin/UserNameEditor";
import { DeleteUserAction } from "@/components/admin/DeleteUserAction";
import { MembershipBadge } from "@/components/membership/MembershipBadge";

interface UserManagementClientProps {
    initialUsers: any[];
}

export default function UserManagementClient({ initialUsers }: UserManagementClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");

    // Filter Logic
    const filteredUsers = users.filter(user => {
        // Search
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (user.full_name?.toLowerCase() || "").includes(searchLower) ||
            (user.email?.toLowerCase() || "").includes(searchLower) ||
            (user.phone?.toLowerCase() || "").includes(searchLower) ||
            (user.whatsapp_number?.toLowerCase() || "").includes(searchLower);

        // Role Filter
        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        // Tier Filter
        const matchesTier = tierFilter === "all" || (user.membership_tier || "bronze") === tierFilter;

        return matchesSearch && matchesRole && matchesTier;
    });

    // Counts
    const studentCount = users.filter(u => u.role === 'student').length;
    const instructorCount = users.filter(u => u.role === 'instructor').length;
    const adminCount = users.filter(u => u.role === 'super_admin').length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{studentCount}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Instructors</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{instructorCount}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Super Admins</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-purple-600">{adminCount}</div></CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, Email, Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setRoleFilter("all"); setTierFilter("all"); }}>
                    Reset
                </Button>
            </div>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>Users List ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No users match your filters.</p>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition gap-4"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <UserNameEditor userId={user.id} currentName={user.full_name} />
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <UserEmailEditor userId={user.id} currentEmail={user.email} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-xs">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                                            </div>

                                            {/* Phone Numbers */}
                                            <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 mt-1">
                                                <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
                                                    <Phone className="h-3 w-3 text-slate-500" />
                                                    <UserPhoneEditor userId={user.id} currentPhone={user.phone || user.phone_number} />
                                                </div>
                                                {user.whatsapp_number && (
                                                    <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                        <MessageCircle className="h-3 w-3 text-green-600" />
                                                        <span className="text-green-700 font-medium">{user.whatsapp_number}</span>
                                                        <span className="text-[10px] text-green-600 uppercase tracking-wider font-bold">WhatsApp</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 md:border-l md:pl-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Role</div>
                                            <UserRoleSelector userId={user.id} currentRole={user.role} />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Tier</div>
                                            <UserTierSelector userId={user.id} currentTier={user.membership_tier || 'bronze'} />
                                        </div>
                                        <div className="ml-2">
                                            <DeleteUserAction userId={user.id} userName={user.full_name || 'User'} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
