import { getAllUsers } from "@/actions/admin/get-all-users";
import UserManagementClient from "@/components/admin/UserManagementClient";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const users = await getAllUsers();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage all users, their roles, and membership tiers</p>
            </div>
            <UserManagementClient initialUsers={users} />
        </div>
    );
}
