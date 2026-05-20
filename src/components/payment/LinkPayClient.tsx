"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, ShieldCheck, Mail, User, Phone, ArrowRight, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface LinkPayClientProps {
    link: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        target_id: string;
        price: number;
    };
    details: {
        title: string;
        description: string | null;
        imageUrl?: string | null;
    };
}

export function LinkPayClient({ link, details }: LinkPayClientProps) {
    // Form Inputs
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    // Flow States
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState<"initiating" | "waiting" | "verifying" | "done">("initiating");
    const [successData, setSuccessData] = useState<{
        isNewUser: boolean;
        email: string;
        tempPassword?: string | null;
    } | null>(null);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Load Razorpay Checkout Overlay
    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !whatsappNumber) {
            toast.error("Please fill in all details");
            return;
        }

        setIsProcessing(true);
        setProcessingStep("initiating");

        try {
            // 1. Create Razorpay order
            const orderRes = await fetch("/api/payment-links/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    linkId: link.id,
                    fullName,
                    email,
                    whatsappNumber
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.error || "Failed to create order");
            }

            const { orderId, amount, currency, keyId } = await orderRes.json();

            setProcessingStep("waiting");

            // 2. Load Razorpay script if needed
            if (!window.Razorpay) {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // 3. Open Razorpay Checkout overlay
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "ATCESS DIGITAL HUB",
                description: link.title,
                order_id: orderId,
                prefill: {
                    name: fullName,
                    email: email,
                    contact: whatsappNumber
                },
                notes: {
                    linkId: link.id,
                    whatsappNumber: whatsappNumber
                },
                theme: {
                    color: "#9333ea" // purple-600
                },
                handler: async function (response: any) {
                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
                    
                    setProcessingStep("verifying");

                    try {
                        const verifyRes = await fetch("/api/payment-links/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                linkId: link.id,
                                fullName,
                                email,
                                whatsappNumber,
                                razorpay_payment_id,
                                razorpay_order_id,
                                razorpay_signature
                            })
                        });

                        const data = await verifyRes.json();
                        
                        if (!verifyRes.ok) {
                            throw new Error(data.error || "Payment verification failed");
                        }

                        setSuccessData(data);
                        setProcessingStep("done");
                        toast.success("Payment successful!");
                    } catch (verifyErr: any) {
                        console.error("Verification error:", verifyErr);
                        setIsProcessing(false);
                        toast.error(verifyErr.message || "Failed to verify payment. Please contact support.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        toast.info("Payment cancelled");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            console.error("Payment initiation error:", err);
            setIsProcessing(false);
            toast.error(err.message || "Could not initiate payment");
        }
    };

    // Auto-login new user or redirect existing
    const handleGoToDashboard = async () => {
        if (successData?.isNewUser && successData.tempPassword) {
            const supabase = createClient();
            try {
                const { error } = await supabase.auth.signInWithPassword({
                    email: successData.email,
                    password: successData.tempPassword
                });

                if (error) {
                    console.error("Auto-login error:", error);
                    window.location.href = "/login";
                } else {
                    window.location.href = "/dashboard";
                }
            } catch (err) {
                console.error(err);
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/dashboard";
        }
    };

    // Copy temporary password
    const handleCopyPassword = () => {
        if (successData?.tempPassword) {
            navigator.clipboard.writeText(successData.tempPassword);
            setCopiedPassword(true);
            toast.success("Password copied!");
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    // Rendering Success Screen
    if (processingStep === "done" && successData) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center text-white relative">
                        <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Payment Successful!</h2>
                        <p className="text-white/80 text-sm mt-1">Welcome to ATCESS Digital Hub</p>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        <div className="text-center text-slate-600 dark:text-slate-400 text-sm">
                            Your payment of <strong className="text-slate-900 dark:text-white">₹{link.price.toLocaleString("en-IN")}</strong> was captured successfully. 
                            You are now enrolled.
                        </div>

                        {successData.isNewUser ? (
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                                <h3 className="text-sm font-semibold text-purple-600 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4" />
                                    Your Portal Account Credentials
                                </h3>
                                <p className="text-xs text-muted-foreground leading-normal">
                                    A student account has been created for your email. Use the temporary password below to log in.
                                </p>
                                <div className="space-y-2 pt-1.5">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Username / Email</label>
                                        <div className="text-sm font-mono font-medium text-slate-900 dark:text-white truncate">
                                            {successData.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Temporary Password</label>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 mt-0.5">
                                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                                                {successData.tempPassword}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={handleCopyPassword}
                                            >
                                                {copiedPassword ? (
                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4 text-slate-400" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl text-xs text-purple-700 dark:text-purple-300">
                                You already have an active account in our LMS. Tap below to access your dashboard.
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-6 pt-0">
                        <Button
                            onClick={handleGoToDashboard}
                            className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center justify-center gap-2"
                        >
                            Go to Portal Dashboard
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center">
            
            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
                        <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                {processingStep === "initiating" && "Securing Connection..."}
                                {processingStep === "waiting" && "Awaiting Payment..."}
                                {processingStep === "verifying" && "Verifying Transaction..."}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 leading-normal">
                                {processingStep === "initiating" && "Preparing secure checkout order via Razorpay."}
                                {processingStep === "waiting" && "Complete payment on the Razorpay overlay pop-up."}
                                {processingStep === "verifying" && "Connecting to server to finalize enrollment."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Product Detail Card */}
                <div className="md:col-span-7 space-y-6">
                    <div className="space-y-2">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 capitalize text-xs px-2.5 py-0.5 rounded-full font-semibold">
                            {link.type === "tier" ? `${link.target_id} plan` : "Program Course"}
                        </Badge>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            {details.title}
                        </h1>
                        {details.description && (
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {details.description}
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm uppercase tracking-wider font-bold text-slate-400">Order Summary</h3>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{details.title}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">₹{link.price.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-base font-bold text-slate-900 dark:text-white">Total Amount Due</span>
                            <span className="text-2xl font-black text-purple-600">₹{link.price.toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                        <span>Secured by Razorpay. SSL-encrypted checkout network.</span>
                    </div>
                </div>

                {/* Form Billing Card */}
                <Card className="md:col-span-5 shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            Student Details
                        </CardTitle>
                        <CardDescription>
                            Enter your contact details to enroll and create your portal access.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handlePayment}>
                        <CardContent className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="user-name" className="font-semibold text-slate-700 dark:text-slate-300">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="user-name"
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <Label htmlFor="user-email" className="font-semibold text-slate-700 dark:text-slate-300">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="user-email"
                                        type="email"
                                        placeholder="yourname@gmail.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-normal">
                                    Important: Credentials and link alerts will be synced to this email.
                                </p>
                            </div>

                            {/* WhatsApp number */}
                            <div className="space-y-1.5">
                                <Label htmlFor="user-whatsapp" className="font-semibold text-slate-700 dark:text-slate-300">WhatsApp Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="user-whatsapp"
                                        type="tel"
                                        placeholder="WhatsApp phone number"
                                        required
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-normal">
                                    Used for dashboard access validation and WhatsApp support channels.
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-sm flex items-center justify-center gap-2"
                            >
                                <CreditCard className="h-4 w-4" />
                                Pay & Register Now
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

            </div>
        </div>
    );
}
