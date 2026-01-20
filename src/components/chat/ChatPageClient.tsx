"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { AIChatInterface } from "@/components/chat/AIChatInterface";
import { cn } from "@/lib/utils";
import { MessageSquare, ShieldAlert } from "lucide-react";

interface ChatPageClientProps {
    currentUserId: string;
    currentUserTier: string;
    currentUserRole?: string;
}

export default function ChatPageClient({ currentUserId, currentUserTier, currentUserRole }: ChatPageClientProps) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChatInfo, setSelectedChatInfo] = useState<any>(null);

    // Limited Offer Banner Logic
    const showUpgradeBanner = ["bronze", "silver"].includes(currentUserTier);

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-black/20">
            {/* Sidebar - Hidden on mobile if chat is selected */}
            <div className={cn(
                "w-full md:w-[320px] lg:w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 transition-all duration-300",
                selectedChatId ? "hidden md:flex" : "flex"
            )}>
                {showUpgradeBanner && (
                    <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 text-center font-medium flex items-center justify-center gap-2">
                        <ShieldAlert className="w-3 h-3" />
                        Limited Period Offer for {currentUserTier.charAt(0).toUpperCase() + currentUserTier.slice(1)} Members!
                    </div>
                )}
                <ChatSidebar
                    currentUserId={currentUserId}
                    onSelectChat={(id, info) => {
                        setSelectedChatId(id);
                        setSelectedChatInfo(info);
                    }}
                    selectedConversationId={selectedChatId}
                />
            </div>

            {/* Chat Window - Hidden on mobile if no chat selected */}
            <div className={cn(
                "flex-1 h-full bg-[#f0f2f5] dark:bg-black/40",
                selectedChatId ? "flex" : "hidden md:flex"
            )}>
                {selectedChatId === 'ai-coach' ? (
                    <div className="w-full h-full flex flex-col">
                        <AIChatInterface onBack={() => setSelectedChatId(null)} />
                    </div>
                ) : selectedChatId && selectedChatInfo ? (
                    <div className="w-full h-full flex flex-col">
                        <ChatWindow
                            conversationId={selectedChatId}
                            chatInfo={selectedChatInfo}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onBack={() => setSelectedChatId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full shadow-inner animate-pulse">
                            <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-light text-slate-600 dark:text-slate-300">Community Chat & AI Coach</h2>
                            <p className="text-sm mt-2 max-w-sm mx-auto">
                                Select a conversation from the sidebar to start messaging.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
