"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Pin, Bot } from "lucide-react"; // Changed icon
import { formatDistanceToNow } from "date-fns";
import { getGlobalGroupChat } from "@/actions/chat-actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    currentUserId: string;
    onSelectChat: (conversationId: string, groupInfo: any) => void;
    selectedConversationId: string | null;
}

export function ChatSidebar({ currentUserId, onSelectChat, selectedConversationId }: ChatSidebarProps) {
    const [groupChat, setGroupChat] = useState<any>(null);
    const supabase = createClient();

    // Fetch Global Chat
    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const group = await getGlobalGroupChat();
                setGroupChat(group);
                setGroupChat(group);
                // Auto-select logic removed to allow mobile users to see the list first
                // if (!selectedConversationId) {
                //     onSelectChat(group.id, {
                //         full_name: group.group_name,
                //         is_group: true,
                //         avatar_url: null
                //     });
                // }
            } catch (e) {
                console.error("Failed to load group chat", e);
            }
        };
        fetchGroup();

        // Subscribe to changes (e.g. last message update)
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
    }, [supabase]); // Removed selectedConversationId dependency to avoid loop

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chats</h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {groupChat && (
                    <div
                        onClick={() => onSelectChat(groupChat.id, {
                            full_name: groupChat.group_name,
                            is_group: true
                        })}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative group",
                            selectedConversationId === groupChat.id
                                ? "bg-purple-50 dark:bg-purple-900/20"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <Avatar className="h-10 w-10 bg-purple-100 dark:bg-purple-900">
                            {/* Group Avatar placeholder */}
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                                <Users className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2">
                                    {groupChat.group_name}
                                </p>
                                {groupChat.last_message_at && (
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {formatDistanceToNow(new Date(groupChat.last_message_at), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {groupChat.last_message_preview || "Welcome to the community chat!"}
                            </p>
                        </div>
                        {/* Pin Icon for Group */}
                        <Pin className="w-3 h-3 text-slate-300 absolute right-3 bottom-3 rotate-45" />
                    </div>
                )}

                {/* ADH AI Coach Integration */}
                <div
                    onClick={() => onSelectChat('ai-coach', {
                        full_name: "ADH AI Coach",
                        is_ai: true
                    })}
                    className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative group",
                        selectedConversationId === 'ai-coach'
                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                >
                    <Avatar className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            <Bot className="w-5 h-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2">
                                ADH AI Coach
                            </p>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-medium px-1.5 py-0.5 rounded-full shrink-0">
                                AI
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Your personal course facilitator
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
