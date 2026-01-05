"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function OnboardingForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");
    const whatsappFromUrl = searchParams.get("whatsapp");

    const [formData, setFormData] = useState({
        fullName: "",
        contactNumber: "",
        whatsappNumber: whatsappFromUrl || "",
        email: "",
        sameAsContact: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!paymentId || !whatsappFromUrl) {
            router.push("/");
        }
    }, [paymentId, whatsappFromUrl, router]);

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            sameAsContact: checked,
            whatsappNumber: checked ? prev.contactNumber : whatsappFromUrl || "",
        }));
    };

    const handleContactChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            contactNumber: value,
            whatsappNumber: prev.sameAsContact ? value : prev.whatsappNumber,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate
            if (!formData.fullName || !formData.email || !formData.contactNumber) {
                toast.error("Please fill all required fields");
                setIsSubmitting(false);
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error("Please enter a valid email");
                setIsSubmitting(false);
                return;
            }

            // Submit to enrollment API
            const response = await fetch("/api/enrollment/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    paymentId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to complete registration");
            }

            toast.success("Registration complete! Redirecting to dashboard...");

            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1500);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <Card className="w-full max-w-2xl bg-slate-900/90 border-slate-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/adh-logo.png"
                            alt="ADH CONNECT"
                            width={200}
                            height={70}
                            className="h-16 w-auto"
                        />
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                        Welcome to ADH CONNECT!
                    </CardTitle>
                    <CardDescription className="text-lg text-slate-300 mt-2">
                        Complete your registration to access all courses
                    </CardDescription>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-green-400 font-medium">Payment Successful</span>
                    </div>
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
                                type="text"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                disabled={isSubmitting}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">
                                Email Address <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isSubmitting}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                            <p className="text-xs text-slate-400">
                                This will be used for your account login
                            </p>
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
                                maxLength={10}
                                disabled={isSubmitting}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
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
                                maxLength={10}
                                disabled={isSubmitting || formData.sameAsContact}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                            <div className="flex items-center space-x-2 mt-2">
                                <Checkbox
                                    id="sameAsContact"
                                    checked={formData.sameAsContact}
                                    onCheckedChange={handleCheckboxChange}
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="sameAsContact"
                                    className="text-sm text-slate-300 cursor-pointer"
                                >
                                    Same as Contact Number
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-lg py-6"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Your Account...
                                </>
                            ) : (
                                "Complete Registration"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        }>
            <OnboardingForm />
        </Suspense>
    );
}
