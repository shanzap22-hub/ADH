"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck, Eye, EyeOff, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
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

    // Verification State
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [initialConfirmedEmail, setInitialConfirmedEmail] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
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

            // Pre-fill Logic
            const isDummyEmail = user.email?.includes("adh.pending");
            const existingName = metadata.full_name === "Student" ? "" : (metadata.full_name || "");

            // Fetch existing profile
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

            // Name Logic
            const profileName = profile?.full_name === "Student" ? "" : profile?.full_name;
            const metaName = metadata.full_name === "Student" ? "" : metadata.full_name;
            const finalName = profileName || metaName || "";
            const finalEmail = isDummyEmail ? "" : (user.email || "");

            // Set Form Data
            setFormData(prev => ({
                ...prev,
                email: finalEmail,
                fullName: finalName,
                whatsappNumber: profile?.whatsapp_number || "",
                contactNumber: profile?.phone_number || "",
                password: initialPassword
            }));

            // Verification Logic
            // If Google user OR standard user with confirmed email matches form email
            if (user.email_confirmed_at && user.email === finalEmail && !isDummyEmail) {
                setIsEmailVerified(true);
                setInitialConfirmedEmail(user.email);
            } else {
                setIsEmailVerified(false);
            }

            setIsLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    // Handle Email Change - Reset Verification
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setFormData({ ...formData, email: newEmail });

        // If they switch back to the initially confirmed email (e.g. Google email), auto-verify
        if (initialConfirmedEmail && newEmail === initialConfirmedEmail) {
            setIsEmailVerified(true);
            setOtpSent(false);
        } else {
            setIsEmailVerified(false);
            setOtpSent(false); // Reset OTP flow
            setOtpCode("");
        }
    };

    // Send OTP
    const handleSendOtp = async () => {
        if (!formData.email || !formData.email.includes("@")) {
            toast.error("Please enter a valid email address first.");
            return;
        }

        setSendingOtp(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");

            setOtpSent(true);
            toast.success(`Verification code sent to ${formData.email}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSendingOtp(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length < 6) {
            toast.error("Please enter the 6-digit code.");
            return;
        }

        setVerifyingOtp(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, code: otpCode }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Invalid Code");

            setIsEmailVerified(true);
            setOtpSent(false); // Hide OTP field
            toast.success("Email Verified Successfully! ✅");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Check: Email Verification
        if (!isEmailVerified) {
            toast.error("Please verify your email address before continuing.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (!formData.fullName || !formData.contactNumber || !formData.whatsappNumber || !formData.email) {
                toast.error("Please fill all required fields");
                setIsSubmitting(false);
                return;
            }

            if (!passwordChanged && formData.password === "") {
                toast.error("Please set a new password.");
                setIsSubmitting(false);
                return;
            }

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
            router.push("/dashboard");
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
                        Please verify your details to activate your account.
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

                        {/* Email Verification Section */}
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-white">
                                Email Address <span className="text-red-400">*</span>
                            </Label>

                            <div className="flex gap-2">
                                <Input
                                    id="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleEmailChange}
                                    disabled={isSubmitting || isEmailVerified} // Lock if verified? Maybe user wants to change. Let's allowing change but it resets verify. See logic above.
                                    // Actually, if verified, maybe lock it to prevent accidental edits. They can unlock by clearing?
                                    // Logic above allows edit.
                                    required
                                    type="email"
                                    className={`bg-slate-800 border-slate-700 text-white transition-all ${isEmailVerified ? 'border-green-500/50 focus:border-green-500' : ''}`}
                                />

                                {isEmailVerified ? (
                                    <Button type="button" variant="ghost" className="text-green-500 cursor-default hover:text-green-500 hover:bg-transparent px-3">
                                        <ShieldCheck className="h-5 w-5 mr-1" />
                                        Verified
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || !formData.email || otpSent}
                                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                                    >
                                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : (otpSent ? "Sent" : "Verify")}
                                    </Button>
                                )}
                            </div>

                            {/* OTP Input */}
                            {otpSent && !isEmailVerified && (
                                <div className="mt-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700 animation-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs text-slate-400 mb-2 block">
                                        Enter the verification code sent to {formData.email}
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="Example: 123456"
                                            className="bg-slate-900 border-slate-600 text-white tracking-widest text-center text-lg font-mono"
                                            maxLength={6}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyingOtp || otpCode.length < 4}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                        </Button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        className="text-xs text-blue-400 hover:underline mt-2 ml-1"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            )}

                            {isEmailVerified && (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Email is verified.
                                </p>
                            )}
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
                                    required={!passwordChanged}
                                    minLength={6}
                                    disabled={isSubmitting}
                                    className={`bg-slate-800 border-slate-700 text-white pr-10 ${passwordChanged ? 'text-green-400 border-green-800' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                                >
                                    {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
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
                                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || !isEmailVerified}
                            className={`w-full font-bold hover:scale-[1.01] transition-all ${!isEmailVerified
                                    ? "bg-slate-700 cursor-not-allowed text-slate-400"
                                    : "bg-gradient-to-r from-orange-500 to-pink-600 text-white"
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> :
                                (!isEmailVerified ? "Verify Email to Continue" : "Save Changes & Start Learning")
                            }
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
