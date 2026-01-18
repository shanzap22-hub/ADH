"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const supabase = createClient();
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            setIsSubmitting(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
                data: {
                    password_changed: true,
                    password_reset_required: false
                }
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Password updated successfully!");

                // Check setup_required
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.setup_required) {
                    router.push("/onboarding/complete");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (error) {
            toast.error("Failed to update password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <Card className="w-full max-w-md bg-slate-900/90 border-slate-800">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-orange-500/10 p-3 rounded-full w-fit mb-4">
                        <LockKeyhole className="h-8 w-8 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 font-bold"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
