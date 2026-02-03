import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { ManualEnrollmentForm } from "./_components/manual-enrollment-form";

export const dynamic = 'force-dynamic';

export default async function EnrollPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // (Updated) Courses no longer needed here as we select Tier directly

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                    Manual Enrollment
                </h1>
                <p className="text-slate-400 mt-1">Grant course access to students without payment</p>
            </div>

            {/* Enrollment Form */}
            <div className="max-w-2xl">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Upgrade User Membership
                        </CardTitle>
                        <CardDescription>
                            Manually grant a student a specific membership tier (Silver, Gold, etc).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ManualEnrollmentForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
