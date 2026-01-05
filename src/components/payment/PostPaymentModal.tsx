"use client";

import { useState } from "react";
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
        contactNumber: "",
        whatsappNumber: whatsappNumber,
        email: "",
        sameAsContact: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            sameAsContact: checked,
            whatsappNumber: checked ? prev.contactNumber : whatsappNumber,
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

            const data = await response.json();

            toast.success("🎉 Welcome to ADH CONNECT! Redirecting to your dashboard...");

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg" suppressHydrationWarning>
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
                        Complete your registration to access all courses
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-base font-medium flex items-center gap-2">
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
                            className="h-11"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
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
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be used for your account login
                        </p>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-base font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Number <span className="text-red-500">*</span>
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
                            className="h-11"
                        />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                        <Label htmlFor="whatsappNumber" className="text-base font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            WhatsApp Number <span className="text-red-500">*</span>
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
                            className="h-11"
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
                                className="text-sm font-medium cursor-pointer"
                            >
                                Same as Contact Number
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base h-12 mt-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating Your Account...
                            </>
                        ) : (
                            "Finalize Enrollment"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
