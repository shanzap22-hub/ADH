"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { AIChatInterface } from "./AIChatInterface";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FloatingAIChatProps {
    isAllowed: boolean;
    initialTermsAccepted?: boolean;
}

export const FloatingAIChat = ({ isAllowed, initialTermsAccepted = false }: FloatingAIChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(initialTermsAccepted);
    const [loadingTerms, setLoadingTerms] = useState(false);

    useEffect(() => {
        setTermsAccepted(initialTermsAccepted);
    }, [initialTermsAccepted]);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Hides BottomNav on mobile when chat is active
    useEffect(() => {
        if (isOpen && !isDesktop) {
            document.documentElement.classList.add("chat-active");
        } else {
            document.documentElement.classList.remove("chat-active");
        }
        return () => {
            document.documentElement.classList.remove("chat-active");
        };
    }, [isOpen, isDesktop]);

    const handleAgreeTerms = async () => {
        setLoadingTerms(true);
        try {
            const res = await fetch('/api/user/terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ai' })
            });

            if (res.ok) {
                setTermsAccepted(true);
                toast.success("Terms accepted successfully!");
            } else {
                toast.error("Failed to save terms agreement");
            }
        } catch (error) {
            console.error("Failed to agree terms:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoadingTerms(false);
        }
    };

    if (!isAllowed) return null;

    return (
        <>
            {/* Floating Toggle Button - 100% Reliable Inline Styles to Bypass Cache/Compile Issues */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "fixed transition-all duration-300 transform hover:scale-110 active:scale-95",
                        "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl",
                        "bg-gradient-to-tr from-indigo-900 via-pink-600 to-orange-500 text-white",
                        "group hover:shadow-pink-500/25 border border-white/20"
                    )}
                    style={{
                        bottom: isDesktop ? "80px" : "96px", // കമ്പ്യൂട്ടറിൽ ഫുൾസ്ക്രീൻ ബട്ടണുമായി മുട്ടാതിരിക്കാൻ അല്പം മുകളിലേക്ക് (80px) ഉയർത്തി വെക്കുന്നു
                        right: isDesktop ? "24px" : "20px",
                        zIndex: 100, // ഇതര എലമെന്റുകൾക്ക് മുകളിൽ വരാൻ zIndex കൂട്ടിയിട്ടുണ്ട്
                    }}
                    aria-label="Ask AI Coach"
                >
                    <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping group-hover:animate-none opacity-75" />
                    <Bot className="w-7 h-7 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                    <Sparkles className="w-3.5 h-3.5 absolute top-2 right-2 text-yellow-300 animate-pulse" />
                </button>
            )}

            {/* Chat Panel Window - Desktop: floating on bottom-right, Mobile: full-screen overlay */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed flex flex-col bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden transition-all duration-300",
                        isDesktop ? "rounded-3xl" : "rounded-none inset-0 pt-[env(safe-area-inset-top,20px)]",
                        "animate-in fade-in duration-300",
                        isDesktop ? "slide-in-from-bottom-5" : "slide-in-from-bottom-full"
                    )}
                    style={{
                        bottom: isDesktop ? "24px" : "0px",
                        right: isDesktop ? "24px" : "0px",
                        left: isDesktop ? "auto" : "0px",
                        top: isDesktop ? "auto" : "0px",
                        width: isDesktop ? "420px" : "100%",
                        height: isDesktop ? "600px" : "100dvh",
                        maxHeight: isDesktop ? "700px" : "none",
                        zIndex: 150, // Cover BottomNav on mobile when open
                    }}
                >
                    {!termsAccepted ? (
                        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
                            {/* Header */}
                            <header className="sticky top-0 h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-pink-500/20">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            ADH AI Coach
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">BETA</span>
                                        </h1>
                                        <p className="text-xs text-slate-500">Terms of Use</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full w-9 h-9 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                                >
                                    <X className="w-5 h-5 stroke-[2.5]" />
                                </button>
                            </header>

                            {/* Terms Content */}
                            <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
                                <p><strong>Please review and accept our AI Chat Terms before proceeding:</strong></p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Accuracy:</strong> The AI Assistant may produce inaccurate information about people, places, or facts. Always verify important information.</li>
                                    <li><strong>Advice:</strong> Do not rely on the AI for medical, legal, financial, or other professional advice.</li>
                                    <li><strong>Privacy:</strong> Do not share sensitive personal information (passwords, credit cards, etc.) in your conversations.</li>
                                    <li><strong>Usage:</strong> You agree not to use the service to generate harmful, illegal, or abusive content.</li>
                                    <li><strong>Monitoring:</strong> Conversations may be reviewed for quality and safety purposes.</li>
                                </ul>
                                <p className="text-xs text-slate-500 mt-4">By clicking "I Agree", you acknowledge that you have read and understood these terms.</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAgreeTerms}
                                    disabled={loadingTerms}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingTerms ? "Saving..." : "I Agree"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <AIChatInterface onClose={() => setIsOpen(false)} isFloating={true} />
                    )}
                </div>
            )}
        </>
    );
};
