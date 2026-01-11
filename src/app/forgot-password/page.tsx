"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
            });

            if (error) {
                toast.error(error.message);
            } else {
                setIsSubmitted(true);
                toast.success("Password reset link sent to your email");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Reset Link
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                                <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold">Check your email</h3>
                            <p className="text-muted-foreground text-sm">
                                We have sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsSubmitted(false)}
                                className="mt-4"
                            >
                                Resend Link
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
