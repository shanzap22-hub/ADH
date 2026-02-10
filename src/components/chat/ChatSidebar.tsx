"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Bot, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getGlobalGroupChat } from "@/actions/chat-actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    currentUserId: string;
    onSelectChat: (conversationId: string, groupInfo: any) => void;
    selectedConversationId: string | null;
    hasCommunityAccess: boolean;
    hasAiAccess: boolean;
    initialGroupChat?: any;
}

export function ChatSidebar({
    currentUserId,
    onSelectChat,
    selectedConversationId,
    hasCommunityAccess,
    hasAiAccess,
    initialGroupChat
}: ChatSidebarProps) {
    const [groupChat, setGroupChat] = useState<any>(initialGroupChat || null);
    const [supabase] = useState(() => createClient());

    // Fetch Global Chat only if user has community access AND no initial data
    useEffect(() => {
        if (!hasCommunityAccess) return;

        if (!initialGroupChat && !groupChat) {
            const fetchGroup = async () => {
                try {
                    const group = await getGlobalGroupChat();
                    setGroupChat(group);
                } catch (e) {
                    console.error("Failed to load group chat", e);
                }
            };
            fetchGroup();
        }

        // Subscribe to changes
        const channel = supabase.channel('group_chat_list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'chat_conversations', filter: `is_group=eq.true` },
                (payload) => {
                    setGroupChat((prev: any) => ({ ...prev, ...payload.new }));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, hasCommunityAccess, initialGroupChat]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-r border-white/20 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-white/10 dark:border-slate-800">
                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                    Chats
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Connect instantly</p>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Community Chat */}
                {groupChat && (
                    <div
                        onClick={() => {
                            if (hasCommunityAccess) {
                                onSelectChat(groupChat.id, {
                                    full_name: groupChat.group_name,
                                    is_group: true
                                });
                            }
                        }}
                        className={cn(
                            "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border relative overflow-hidden",
                            hasCommunityAccess ? "cursor-pointer hover:-translate-y-0.5" : "cursor-not-allowed opacity-70 grayscale",
                            hasCommunityAccess && selectedConversationId === groupChat.id
                                ? "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                                : "bg-white/60 dark:bg-slate-900/40 border-white/20 dark:border-slate-800 hover:bg-white hover:shadow-md"
                        )}
                    >
                        {/* Active Indicator Strip */}
                        {hasCommunityAccess && selectedConversationId === groupChat.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-purple-600" />
                        )}

                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                            hasCommunityAccess ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" : "bg-slate-200 text-slate-400"
                        )}>
                            {hasCommunityAccess ? <Users className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <p className={cn(
                                    "font-bold text-sm truncate",
                                    selectedConversationId === groupChat.id ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-200"
                                )}>
                                    {groupChat.group_name}
                                </p>
                                {hasCommunityAccess && groupChat.last_message_at && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {formatDistanceToNow(new Date(groupChat.last_message_at), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                                {hasCommunityAccess
                                    ? (groupChat.last_message_preview || "Join the community interaction...")
                                    : "Unlock to access community chat"
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* AI Coach */}
                <div
                    onClick={() => {
                        if (hasAiAccess) {
                            onSelectChat('ai-coach', {
                                full_name: "ADH AI Coach",
                                is_ai: true
                            });
                        }
                    }}
                    className={cn(
                        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border relative overflow-hidden",
                        hasAiAccess ? "cursor-pointer hover:-translate-y-0.5" : "cursor-not-allowed opacity-70 grayscale",
                        hasAiAccess && selectedConversationId === 'ai-coach'
                            ? "bg-white dark:bg-slate-800 border-pink-200 dark:border-pink-900 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/20"
                            : "bg-white/60 dark:bg-slate-900/40 border-white/20 dark:border-slate-800 hover:bg-white hover:shadow-md"
                    )}
                >
                    {/* Active Indicator Strip */}
                    {hasAiAccess && selectedConversationId === 'ai-coach' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-orange-500" />
                    )}

                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                        hasAiAccess ? "bg-gradient-to-br from-pink-500 to-orange-500 text-white" : "bg-slate-200 text-slate-400"
                    )}>
                        {hasAiAccess ? <Bot className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <p className={cn(
                                "font-bold text-sm truncate flex items-center gap-2",
                                selectedConversationId === 'ai-coach' ? "text-pink-900 dark:text-pink-100" : "text-slate-700 dark:text-slate-200"
                            )}>
                                ADH AI Coach
                                {hasAiAccess && (
                                    <span className="text-[9px] bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-600 uppercase tracking-wider font-extrabold border border-pink-200 px-1.5 py-0.5 rounded-full">
                                        Pro
                                    </span>
                                )}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                            {hasAiAccess
                                ? "Ask me anything about your course..."
                                : "Unlock to access AI mentor"
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400">Atcess Digital Hub Secured Chat</p>
            </div>
        </div>
    );
}
