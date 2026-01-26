"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function CompleteProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        contactNumber: "",
        whatsappNumber: "",
        sameAsContact: false,
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [passwordChanged, setPasswordChanged] = useState(false);
    const [isSocialLogin, setIsSocialLogin] = useState(false);
    const [showPasswordText, setShowPasswordText] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Check metadata
            const metadata = user.user_metadata || {};
            const appData = user.app_metadata || {};
            const providers = appData.providers || [];

            const isGoogle = providers.includes('google');
            const hasChangedPw = metadata.password_changed === true;

            setPasswordChanged(hasChangedPw);
            setIsSocialLogin(isGoogle);

            const showPassword = true; // Always show password field container

            // Pre-fill Logic
            const isDummyEmail = user.email?.includes("adh.pending");
            const existingName = metadata.full_name === "Student" ? "" : (metadata.full_name || "");

            // Fetch existing profile to pre-fill WhatsApp number (from payment)
            const { data: profile } = await supabase
                .from("profiles")
                .select("whatsapp_number, phone_number, full_name")
                .eq("id", user.id)
                .single();

            // Password State Logic
            let initialPassword = "";
            if (hasChangedPw) {
                initialPassword = "********";
            }

            setFormData(prev => ({
                ...prev,
                email: isDummyEmail ? "" : (user.email || ""), // Empty if dummy
                fullName: profile?.full_name || existingName, // Prefer profile name if exists
                whatsappNumber: profile?.whatsapp_number || "", // Pre-fill WhatsApp from payment
                contactNumber: profile?.phone_number || "", // Pre-fill Phone if exists
                password: initialPassword
            }));

            setIsLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    // Simple handlers
    const handleContactChange = (value: string) => {
        setFormData((prev) => ({ ...prev, contactNumber: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.fullName || !formData.contactNumber || !formData.whatsappNumber || !formData.email) {
                toast.error("Please fill all required fields");
                setIsSubmitting(false);
                return;
            }

            // Add password validation if it's not a dummy value and not already changed
            if (!passwordChanged && formData.password === "") {
                toast.error("Please set a new password.");
                setIsSubmitting(false);
                return;
            }

            // Prepare payload
            const payload = {
                ...formData,
                password: formData.password === "********" ? "SKIPPED" : formData.password
            };

            const response = await fetch("/api/user/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            toast.success("Profile updated! Welcome to the dashboard.");
            router.push("/dashboard"); // Redirect to dashboard
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-orange-500/10 p-3 rounded-full w-fit mb-4">
                        <UserCheck className="h-8 w-8 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Complete Your Profile
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Please provide your details to access your courses.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-white">
                                Full Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                disabled={isSubmitting}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        {/* Email (Editable now) */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">
                                Email Address <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isSubmitting}
                                required
                                type="email"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                            <p className="text-xs text-slate-500">This will be used for login & updates.</p>
                        </div>

                        {/* WhatsApp Number */}
                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber" className="text-white">
                                WhatsApp Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="whatsappNumber"
                                type="tel"
                                placeholder="9876543210"
                                value={formData.whatsappNumber}
                                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                required
                                disabled={isSubmitting}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        {/* Contact Number */}
                        <div className="space-y-2">
                            <Label htmlFor="contactNumber" className="text-white">
                                Contact Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="contactNumber"
                                type="tel"
                                placeholder="9876543210"
                                value={formData.contactNumber}
                                onChange={(e) => handleContactChange(e.target.value)}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 font-bold hover:scale-[1.01] transition-all"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Changes & Start Learning"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
