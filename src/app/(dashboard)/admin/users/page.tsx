import dynamic from "next/dynamic";
import { getAllUsers } from "@/actions/admin/get-all-users";
import { Skeleton } from "@/components/ui/skeleton";

// Performance Optimization: Dynamic import for heavy client component
const UserManagementClient = dynamic(
    () => import("@/components/admin/UserManagementClient"),
    {
        loading: () => (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
                <div className="h-[600px] w-full bg-slate-100/50 rounded-xl animate-pulse" />
            </div>
        )
    }
);

// 2026 Performance: 2-minute cache for admin pages
export const revalidate = 120;
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
