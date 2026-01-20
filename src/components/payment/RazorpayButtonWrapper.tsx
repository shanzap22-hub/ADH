"use client";

import { useState } from "react";
import { PrePaymentModal } from "./PrePaymentModal";
import { PostPaymentModal } from "./PostPaymentModal";
import { toast } from "sonner";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayButtonWrapperProps {
    children: React.ReactNode;
}

export function RazorpayButtonWrapper({ children }: RazorpayButtonWrapperProps) {
    const [isPrePaymentOpen, setIsPrePaymentOpen] = useState(false);
    const [isPostPaymentOpen, setIsPostPaymentOpen] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [paymentId, setPaymentId] = useState("");

    const handleProceedToPayment = async (whatsapp: string, couponCode?: string) => {
        setWhatsappNumber(whatsapp);

        try {
            console.log("[PAYMENT_WRAPPER] Creating order for:", whatsapp, "Coupon:", couponCode);

            // Create Razorpay order
            const response = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    whatsappNumber: whatsapp,
                    couponCode: couponCode
                }),
            });

            console.log("[PAYMENT_WRAPPER] Response status:", response.status);
            console.log("[PAYMENT_WRAPPER] Response headers:", response.headers.get('content-type'));

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `Server error: ${response.status}`;

                try {
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        console.error("[PAYMENT_WRAPPER] Error response:", errorData);
                        errorMessage = errorData.error || errorMessage;
                    } else {
                        const textError = await response.text();
                        console.error("[PAYMENT_WRAPPER] Non-JSON error:", textError.substring(0, 200));
                        errorMessage = "Server returned an error. Check Razorpay credentials.";
                    }
                } catch (parseError) {
                    console.error("[PAYMENT_WRAPPER] Failed to parse error:", parseError);
                }

                throw new Error(errorMessage);
            }

            const { orderId, amount, currency } = await response.json();
            console.log("[PAYMENT_WRAPPER] Order created:", orderId);

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                document.body.appendChild(script);

                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount,
                currency: currency,
                name: "ADH CONNECT",
                description: "Premium Course Bundle - Meta Marketing, AI & Leadership",
                order_id: orderId,
                prefill: {
                    contact: whatsapp,
                },
                notes: {
                    whatsappNumber: whatsapp,
                },
                theme: {
                    color: "#f97316", // Orange-500
                },
                handler: async function (response: any) {
                    // Payment successful - verify and show post-payment modal
                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                    try {
                        // Verify payment
                        const verifyResponse = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id,
                                razorpay_order_id,
                                razorpay_signature,
                                whatsappNumber: whatsapp,
                            }),
                        });

                        if (verifyResponse.ok) {
                            // Close pre-payment modal
                            setIsPrePaymentOpen(false);

                            // Store payment ID and open post-payment modal
                            setPaymentId(razorpay_payment_id);
                            setIsPostPaymentOpen(true);
                        } else {
                            toast.error("Payment verification failed. Please contact support.");
                        }
                    } catch (error) {
                        toast.error("Failed to verify payment. Please contact support.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Payment cancelled");
                        setIsPrePaymentOpen(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            setIsPrePaymentOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to initiate payment");
            setIsPrePaymentOpen(false);
        }
    };

    return (
        <>
            <div onClick={() => setIsPrePaymentOpen(true)} className="cursor-pointer">
                {children}
            </div>

            <PrePaymentModal
                isOpen={isPrePaymentOpen}
                onClose={() => setIsPrePaymentOpen(false)}
                onProceed={handleProceedToPayment}
            />

            <PostPaymentModal
                isOpen={isPostPaymentOpen}
                onClose={() => { }} // Prevent closing - must complete registration
                paymentId={paymentId}
                whatsappNumber={whatsappNumber}
            />
        </>
    );
}
