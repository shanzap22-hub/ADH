"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { AIChatInterface } from "./AIChatInterface";
import { cn } from "@/lib/utils";

interface FloatingAIChatProps {
    isAllowed: boolean;
}

export const FloatingAIChat = ({ isAllowed }: FloatingAIChatProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isAllowed) return null;

    return (
        <>
            {/* Floating Toggle Button */}
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
                        // LessonNavigation ബാറിന് മുകളിൽ (~80px) ബട്ടൺ വരുന്ന രീതിയിൽ
                        bottom: "90px",
                        right: "20px",
                        zIndex: 60,
                    }}
                    aria-label="Ask AI Coach"
                >
                    <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping group-hover:animate-none opacity-75" />
                    <Bot className="w-7 h-7 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                    <Sparkles className="w-3.5 h-3.5 absolute top-2 right-2 text-yellow-300 animate-pulse" />
                </button>
            )}

            {/* Chat Panel Window */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed flex flex-col bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden transition-all duration-300",
                        "rounded-3xl",
                        "animate-in fade-in slide-in-from-bottom-5 duration-300"
                    )}
                    style={{
                        // മൊബൈൽ + ഡെസ്ക്ടോപ്പ് — LessonNavigation-ന് മുകളിൽ
                        bottom: "90px",
                        right: "16px",
                        left: "16px",
                        height: "48dvh",
                        maxHeight: "420px",
                        zIndex: 60,
                    }}
                >
                    <AIChatInterface onClose={() => setIsOpen(false)} />
                </div>
            )}
        </>
    );
};
