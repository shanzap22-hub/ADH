"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Tag, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PrePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (whatsappNumber: string, couponCode?: string) => void;
}

export function PrePaymentModal({ isOpen, onClose, onProceed }: PrePaymentModalProps) {
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const checkCoupon = async () => {
        if (!couponCode.trim()) return;

        setIsCheckingCoupon(true);
        setCouponMessage(null);

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode })
            });
            const data = await res.json();

            if (data.valid) {
                setAppliedCoupon({
                    code: data.code,
                    discount: data.calculatedDiscount
                });
                setCouponMessage({ type: 'success', text: `Coupon Applied! Saved ₹${data.calculatedDiscount}` });
            } else {
                setAppliedCoupon(null);
                setCouponMessage({ type: 'error', text: data.message || "Invalid Coupon" });
            }
        } catch (error) {
            setCouponMessage({ type: 'error', text: "Failed to validate coupon" });
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponMessage(null);
    };

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
        // Pass coupon code if applied
        onProceed(cleanedNumber, appliedCoupon ? appliedCoupon.code : undefined);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            validateAndProceed();
        }
    };

    const FINAL_PRICE = appliedCoupon ? (4999 - appliedCoupon.discount) : 4999;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" suppressHydrationWarning>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                        Join ADH CONNECT
                    </DialogTitle>
                    <DialogDescription>
                        Enter your WhatsApp number to proceed with the payment for ₹{FINAL_PRICE.toLocaleString()}
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
                    </div>

                    {/* Coupon Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Have a Coupon Code?
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter Code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                disabled={!!appliedCoupon || isCheckingCoupon}
                                className="uppercase"
                            />
                            {appliedCoupon ? (
                                <Button variant="outline" onClick={removeCoupon} type="button" className="text-red-500 border-red-200 hover:bg-red-50">
                                    <X className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={checkCoupon}
                                    disabled={!couponCode || isCheckingCoupon}
                                    type="button"
                                >
                                    {isCheckingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                </Button>
                            )}
                        </div>
                        {couponMessage && (
                            <p className={`text-xs ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {couponMessage.text}
                            </p>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300">Course Bundle Value</span>
                            <span className="text-sm text-slate-400 line-through">₹17,000</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex items-center justify-between mb-2 text-green-500">
                                <span className="text-sm">Coupon Discount</span>
                                <span className="text-sm font-medium">- ₹{appliedCoupon.discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t border-dashed border-slate-700 pt-2 mt-2">
                            <span className="font-semibold text-white">You Pay Today</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                                ₹{FINAL_PRICE.toLocaleString()}
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
                            `Pay ₹${FINAL_PRICE.toLocaleString()} →`
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
