"use client";

import { useState, useEffect } from "react";
import { PrePaymentModal } from "./PrePaymentModal";
import { PostPaymentModal } from "./PostPaymentModal";
import { PaymentProcessingOverlay } from "./PaymentProcessingOverlay";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
    const [userEmail, setUserEmail] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Fetch User Email on Mount
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch profile email (User's preferred email)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', user.id)
                    .single();

                if (profile?.email) {
                    setUserEmail(profile.email);
                } else if (user.email) {
                    setUserEmail(user.email);
                }
            }
        };
        fetchUser();
    }, []);

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
                    email: userEmail || undefined // Prefill Auth Email
                },
                notes: {
                    whatsappNumber: whatsapp,
                },
                theme: {
                    color: "#f97316", // Orange-500
                },
                handler: async function (response: any) {
                    // Payment successful - Step 1: Verify, Step 2: Finalize
                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                    try {
                        setIsProcessingPayment(true);

                        // STEP 1: Verify payment signature and store in payments_temp
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

                        if (!verifyResponse.ok) {
                            throw new Error("Payment verification failed");
                        }

                        // STEP 2: Finalize enrollment (create user, enroll in courses)
                        const finalizeRes = await fetch("/api/enrollment/finalize", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paymentId: razorpay_payment_id,
                                whatsappNumber: whatsapp,
                                // Backend fetches email from Razorpay
                            }),
                        });

                        const data = await finalizeRes.json();

                        if (!finalizeRes.ok) {
                            throw new Error(data.error || "Enrollment failed");
                        }

                        // Auto-Login if new user credentials returned
                        if (data.tempPassword && data.email) {
                            const { createClient } = await import("@/lib/supabase/client");
                            const supabase = createClient();

                            const { error: signInError } = await supabase.auth.signInWithPassword({
                                email: data.email,
                                password: data.tempPassword
                            });

                            if (signInError) {
                                console.error("Auto-login failed:", signInError);
                                toast.error("Account created but auto-login failed. Please login manually.");
                                setIsProcessingPayment(false); // Hide overlay on this specific error? Or keep it and redirect? 
                                // Actually better to redirect to login if auto-login fails
                                window.location.href = "/login";
                            } else {
                                // Redirect to dashboard -> middleware sends to onboarding
                                window.location.href = "/dashboard";
                            }
                        } else {
                            // Existing user - just redirect
                            window.location.href = "/dashboard";
                        }

                    } catch (error: any) {
                        console.error("Payment Error:", error);
                        setIsProcessingPayment(false); // Hide overlay on error
                        toast.error(error.message || "Payment processing failed. Contact support.");
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
            {/* Full Screen Payment Overlay */}
            {isProcessingPayment && (
                <PaymentProcessingOverlay
                    isVisible={isProcessingPayment}
                />
            )}
        </>
    );
}
