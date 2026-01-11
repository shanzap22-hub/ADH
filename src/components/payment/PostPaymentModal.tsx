"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PostPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentId: string;
    whatsappNumber: string;
}

export function PostPaymentModal({ isOpen, onClose, paymentId, whatsappNumber }: PostPaymentModalProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        contactNumber: whatsappNumber || "", // Pre-fill with number entered before payment
        isWhatsappSame: true,
        customWhatsappNumber: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state when whatsappNumber prop changes (Fix for Data Persistence)
    useEffect(() => {
        if (whatsappNumber) {
            setFormData(prev => ({
                ...prev,
                contactNumber: whatsappNumber,
                isWhatsappSame: true,
                customWhatsappNumber: ""
            }));
        }
    }, [whatsappNumber]);

    const handleIsWhatsappChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            isWhatsappSame: checked,
            customWhatsappNumber: checked ? "" : prev.customWhatsappNumber
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate
            if (!formData.fullName || !formData.email || !formData.contactNumber || !formData.password || !formData.confirmPassword) {
                toast.error("Please fill all required fields");
                setIsSubmitting(false);
                return;
            }

            if (!formData.isWhatsappSame && !formData.customWhatsappNumber) {
                toast.error("Please enter your WhatsApp number");
                setIsSubmitting(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match");
                setIsSubmitting(false);
                return;
            }

            if (formData.password.length < 6) {
                toast.error("Password must be at least 6 characters");
                setIsSubmitting(false);
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error("Please enter a valid email");
                setIsSubmitting(false);
                return;
            }

            const finalWhatsappNumber = formData.isWhatsappSame ? formData.contactNumber : formData.customWhatsappNumber;

            // Submit to enrollment API
            const response = await fetch("/api/enrollment/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    contactNumber: formData.contactNumber,
                    whatsappNumber: finalWhatsappNumber,
                    password: formData.password,
                    paymentId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to complete registration");
            }

            const data = await response.json();

            toast.success("🎉 Account Created! Please check your email to verify your account.", {
                duration: 5000,
            });

            setTimeout(() => {
                router.push("/login?verify=true");
            }, 2000);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" suppressHydrationWarning>
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Payment Successful! 🎉
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        Set up your account password to access your courses
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Contact Number (Pre-filled) */}
                    <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="contactNumber"
                            type="tel"
                            placeholder="9876543210"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            required
                            maxLength={15}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* WhatsApp Check */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                        <Label className="text-sm font-medium">Is this your WhatsApp number?</Label>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="whatsapp-yes"
                                    checked={formData.isWhatsappSame}
                                    onCheckedChange={() => handleIsWhatsappChange(true)}
                                />
                                <Label htmlFor="whatsapp-yes" className="cursor-pointer">Yes, same number</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="whatsapp-no"
                                    checked={!formData.isWhatsappSame}
                                    onCheckedChange={() => handleIsWhatsappChange(false)}
                                />
                                <Label htmlFor="whatsapp-no" className="cursor-pointer">No, different number</Label>
                            </div>
                        </div>

                        {!formData.isWhatsappSame && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="customWhatsapp" className="text-xs mb-1 block">Enter WhatsApp Number</Label>
                                <Input
                                    id="customWhatsapp"
                                    type="tel"
                                    placeholder="Enter WhatsApp Number"
                                    value={formData.customWhatsappNumber}
                                    onChange={(e) => setFormData({ ...formData, customWhatsappNumber: e.target.value })}
                                    maxLength={15}
                                />
                            </div>
                        )}
                    </div>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base h-12 mt-4"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Setting Up Account...
                            </>
                        ) : (
                            "Start Learning Now"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
