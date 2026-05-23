"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { AIChatInterface } from "./AIChatInterface";
import { cn } from "@/lib/utils";

interface FloatingAIChatProps {
    isAllowed: boolean;
}

export const FloatingAIChat = ({ isAllowed }: FloatingAIChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

            {/* Chat Panel Window - 100% Reliable Inline Styles for Desktop Sizing (max 420px) and Mobile stretch */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed flex flex-col bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden transition-all duration-300",
                        "rounded-3xl",
                        "animate-in fade-in slide-in-from-bottom-5 duration-300"
                    )}
                    style={{
                        bottom: isDesktop ? "24px" : "96px",
                        right: isDesktop ? "24px" : "16px",
                        left: isDesktop ? "auto" : "16px",
                        width: isDesktop ? "420px" : "auto",
                        height: isDesktop ? "550px" : "48dvh",
                        maxHeight: isDesktop ? "600px" : "420px",
                        zIndex: 100,
                    }}
                >
                    <AIChatInterface onClose={() => setIsOpen(false)} />
                </div>
            )}
        </>
    );
};
