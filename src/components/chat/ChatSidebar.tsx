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
}

export function ChatSidebar({
    currentUserId,
    onSelectChat,
    selectedConversationId,
    hasCommunityAccess,
    hasAiAccess
}: ChatSidebarProps) {
    const [groupChat, setGroupChat] = useState<any>(null);
    const supabase = createClient();

    // Fetch Global Chat only if user has community access
    useEffect(() => {
        if (!hasCommunityAccess) return;

        const fetchGroup = async () => {
            try {
                const group = await getGlobalGroupChat();
                setGroupChat(group);
            } catch (e) {
                console.error("Failed to load group chat", e);
            }
        };
        fetchGroup();

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
    }, [supabase, hasCommunityAccess]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chats</h2>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Community Chat - Always show, lock if no access */}
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
                            "flex items-center gap-3 p-3 rounded-lg transition-colors relative group",
                            hasCommunityAccess ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                            hasCommunityAccess && selectedConversationId === groupChat.id
                                ? "bg-purple-50 dark:bg-purple-900/20"
                                : hasCommunityAccess && "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <Avatar className="h-10 w-10 bg-purple-100 dark:bg-purple-900">
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                                {hasCommunityAccess ? (
                                    <Users className="w-5 h-5" />
                                ) : (
                                    <Lock className="w-5 h-5" />
                                )}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2 flex items-center gap-2">
                                    {groupChat.group_name}
                                    {!hasCommunityAccess && (
                                        <Lock className="w-3 h-3 text-slate-400" />
                                    )}
                                </p>
                                {hasCommunityAccess && groupChat.last_message_at && (
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {formatDistanceToNow(new Date(groupChat.last_message_at), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {hasCommunityAccess
                                    ? (groupChat.last_message_preview || "Welcome to the community chat!")
                                    : "Upgrade to access community chat"
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* AI Coach - Always show, lock if no access */}
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
                        "flex items-center gap-3 p-3 rounded-lg transition-colors relative group",
                        hasAiAccess ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                        hasAiAccess && selectedConversationId === 'ai-coach'
                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                            : hasAiAccess && "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                >
                    <Avatar className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            {hasAiAccess ? (
                                <Bot className="w-5 h-5" />
                            ) : (
                                <Lock className="w-5 h-5" />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2 flex items-center gap-2">
                                ADH AI Coach
                                {!hasAiAccess && (
                                    <Lock className="w-3 h-3 text-slate-400" />
                                )}
                            </p>
                            {hasAiAccess && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-medium px-1.5 py-0.5 rounded-full shrink-0">
                                    AI
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {hasAiAccess
                                ? "Your personal course facilitator"
                                : "Upgrade to access AI mentor"
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
