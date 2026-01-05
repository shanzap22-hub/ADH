"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

interface PrePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (whatsappNumber: string) => void;
}

export function PrePaymentModal({ isOpen, onClose, onProceed }: PrePaymentModalProps) {
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const validateAndProceed = () => {
        // Validate WhatsApp number (10 digits)
        const cleanedNumber = whatsappNumber.replace(/\D/g, "");

        if (cleanedNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit WhatsApp number");
            return;
        }

        if (!cleanedNumber.startsWith("6") && !cleanedNumber.startsWith("7") && !cleanedNumber.startsWith("8") && !cleanedNumber.startsWith("9")) {
            toast.error("Please enter a valid Indian mobile number");
            return;
        }

        setIsValidating(true);
        onProceed(cleanedNumber);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            validateAndProceed();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" suppressHydrationWarning>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                        Join ADH CONNECT
                    </DialogTitle>
                    <DialogDescription>
                        Enter your WhatsApp number to proceed with the payment for ₹4,999
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-base font-medium">
                            WhatsApp Number
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                id="whatsapp"
                                type="tel"
                                placeholder="9876543210"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10 text-lg py-6"
                                maxLength={10}
                                disabled={isValidating}
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            We'll send course updates and support on WhatsApp
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300">Course Bundle Value</span>
                            <span className="text-sm text-slate-400 line-through">₹17,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">You Pay Today</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                                ₹4,999
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={validateAndProceed}
                        disabled={isValidating}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-lg py-6"
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Proceed to Payment →"
                        )}
                    </Button>

                    <p className="text-center text-xs text-slate-500">
                        Secure payment powered by Razorpay
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
