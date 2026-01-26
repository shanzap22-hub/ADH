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

            // Pre-fill Email and Name (Only if NOT 'Student')
            const existingName = metadata.full_name === "Student" ? "" : (metadata.full_name || "");

            // Fetch existing profile to pre-fill WhatsApp number (from payment)
            const { data: profile } = await supabase
                .from("profiles")
                .select("whatsapp_number, phone_number, full_name")
                .eq("id", user.id)
                .single();

            // Password State Logic
            // If Password WAS changed (Reset flow), show dummy stars.
            // If Google, show empty.
            // If Manual (New), show empty.
            let initialPassword = "";
            if (hasChangedPw) {
                initialPassword = "********";
            }

            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                fullName: profile?.full_name || existingName, // Prefer profile name if exists
                whatsappNumber: profile?.whatsapp_number || "", // Pre-fill WhatsApp from payment
                contactNumber: profile?.phone_number || "", // Pre-fill Phone if exists
                password: initialPassword
            }));

            setIsLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    const handleContactChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            contactNumber: value,
            whatsappNumber: prev.sameAsContact ? value : prev.whatsappNumber,
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            sameAsContact: checked,
            whatsappNumber: checked ? prev.contactNumber : prev.whatsappNumber,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.fullName || !formData.contactNumber) {
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
            // If password is still dummy '********', send SKIPPED
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
                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email Address</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                disabled
                                className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
                            />
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-white">
                                Full Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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

                        {/* Set Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">
                                {passwordChanged ? "Password (Already Set)" : "Set Password"} <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPasswordText ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min 6 chars"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                    disabled={isSubmitting}
                                    className={`bg-slate-800 border-slate-700 text-white pr-10 ${passwordChanged ? 'text-green-400 border-green-800' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                                >
                                    {showPasswordText ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {passwordChanged ?
                                <p className="text-xs text-green-400">✅ Password is set. You can keep it or type a new one.</p> :
                                <p className="text-xs text-slate-400">Create a secure password.</p>
                            }
                        </div>

                        {/* WhatsApp Number */}
                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber" className="text-white">
                                WhatsApp Number <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="whatsappNumber"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={formData.whatsappNumber}
                                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    required
                                    readOnly={formData.sameAsContact}
                                    disabled={isSubmitting}
                                    className={`bg-slate-800 border-slate-700 text-white ${formData.sameAsContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <Checkbox
                                    id="sameAsContact"
                                    checked={formData.sameAsContact}
                                    onCheckedChange={handleCheckboxChange}
                                    disabled={isSubmitting}
                                    className="border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-slate-900"
                                />
                                <label
                                    htmlFor="sameAsContact"
                                    className="text-sm text-slate-300 cursor-pointer select-none"
                                >
                                    Same as Contact Number
                                </label>
                            </div>
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
