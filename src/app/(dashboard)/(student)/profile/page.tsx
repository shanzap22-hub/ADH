import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
        return redirect("/");
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Profile</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Manage your account settings
                    </p>
                </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                    <p className="text-lg font-semibold">{user.email}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</label>
                    <p className="text-sm font-mono text-slate-500">{user.id}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Created</label>
                    <p className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Sign Out Button */}
            <form action="/auth/signout" method="post">
                <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Sign Out
                </button>
            </form>
        </div>
    );
}
