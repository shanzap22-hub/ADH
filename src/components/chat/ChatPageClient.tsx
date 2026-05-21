"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { AIChatInterface } from "@/components/chat/AIChatInterface";
import { cn } from "@/lib/utils";
import { MessageSquare, ShieldAlert, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGlobalGroupChat } from "@/actions/chat-actions";

interface ChatPageClientProps {
    currentUserId: string;
    currentUserTier: string;
    currentUserRole?: string;
    termsAcceptedAi: boolean;
    termsAcceptedCommunity: boolean;
    hasAiAccess: boolean;
    hasCommunityAccess: boolean;
    initialGroupChat?: any;
}

export default function ChatPageClient({
    currentUserId,
    currentUserTier,
    currentUserRole,
    termsAcceptedAi: initialAiTerms,
    termsAcceptedCommunity: initialCommunityTerms,
    hasAiAccess,
    hasCommunityAccess,
    initialGroupChat
}: ChatPageClientProps) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChatInfo, setSelectedChatInfo] = useState<any>(null);
    const searchParams = useSearchParams();

    // Terms State
    const [termsAiAccepted, setTermsAiAccepted] = useState(initialAiTerms);
    const [termsCommunityAccepted, setTermsCommunityAccepted] = useState(initialCommunityTerms);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [pendingChatSelection, setPendingChatSelection] = useState<{ id: string, info: any } | null>(null);
    const [loadingTerms, setLoadingTerms] = useState(false);

    // Deep Linking: Handle URL parameters
    useEffect(() => {
        const action = searchParams.get('action');
        const chatId = searchParams.get('id');

        const autoOpenChat = async () => {
            console.log('[ChatPage] 🔄 Auto-open check:', { action, chatId, hasCommunityAccess });

            if (action === 'community' && hasCommunityAccess && termsCommunityAccepted) {
                try {
                    const group = await getGlobalGroupChat();
                    if (group) {
                        setSelectedChatId(group.id);
                        setSelectedChatInfo({
                            full_name: group.group_name,
                            is_group: true
                        });
                    }
                } catch (e) {
                    console.error("Failed to auto-open community chat", e);
                }
            } else if (action === 'ai' && hasAiAccess && termsAiAccepted) {
                setSelectedChatId('ai-coach');
                setSelectedChatInfo({
                    full_name: "ADH AI Coach",
                    is_ai: true
                });
            } else if (chatId && (hasCommunityAccess || hasAiAccess)) {
                // Generic chat ID opening - you'd need to fetch chat info
                // For now, we'll skip this as it needs more context
            }
        };

        autoOpenChat();
    }, [searchParams, hasCommunityAccess, hasAiAccess, termsAiAccepted, termsCommunityAccepted]);

    // Capacitor App: Handle physical back button when a chat is active
    useEffect(() => {
        if (selectedChatId) {
            (window as any).__onCapacitorBackButton = () => {
                setSelectedChatId(null);
                return true; // handled locally
            };
        } else {
            (window as any).__onCapacitorBackButton = null;
        }

        return () => {
            (window as any).__onCapacitorBackButton = null;
        };
    }, [selectedChatId]);

    // Limited Offer Banner Logic
    const showUpgradeBanner = ["bronze", "silver"].includes(currentUserTier);

    const handleSelectChat = (id: string, info: any) => {
        // Check ACCESS first (tier-based)
        if (id === 'ai-coach' && !hasAiAccess) {
            // No access to AI - show upgrade message or block
            return;
        }

        if (id !== 'ai-coach' && !hasCommunityAccess) {
            // No access to Community Chat - block
            return;
        }

        // Check TERMS second (user agreement)
        if (id === 'ai-coach' && !termsAiAccepted) {
            setPendingChatSelection({ id, info });
            setShowTermsModal(true);
            return;
        }

        if (id !== 'ai-coach' && !termsCommunityAccepted) {
            setPendingChatSelection({ id, info });
            setShowTermsModal(true);
            return;
        }

        // Proceed if both access and terms are satisfied
        setSelectedChatId(id);
        setSelectedChatInfo(info);
    };

    const handleAgreeTerms = async () => {
        if (!pendingChatSelection) return;
        setLoadingTerms(true);

        try {
            const type = pendingChatSelection.id === 'ai-coach' ? 'ai' : 'community';

            const res = await fetch('/api/user/terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (res.ok) {
                if (type === 'ai') setTermsAiAccepted(true);
                else setTermsCommunityAccepted(true);

                setShowTermsModal(false);
                setSelectedChatId(pendingChatSelection.id);
                setSelectedChatInfo(pendingChatSelection.info);
                setPendingChatSelection(null);
            }
        } catch (error) {
            console.error("Failed to agree terms", error);
        } finally {
            setLoadingTerms(false);
        }
    };

    const isAiTerms = pendingChatSelection?.id === 'ai-coach';

    return (
        // Mobile: Fixed top-0 (no header), Bottom-16 to clear BottomNav
        // Added relative to container so modal positions correctly against viewport if needed, or fixed.
        <div className="fixed left-0 right-0 top-0 bottom-16 pt-[env(safe-area-inset-top)] lg:pt-0 lg:static lg:h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-black/20 z-0">
            {/* Sidebar - Hidden on mobile if chat is selected */}
            <div className={cn(
                "w-full md:w-[280px] lg:w-[320px] xl:w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 transition-all duration-300",
                selectedChatId ? "hidden md:flex" : "flex"
            )}>

                <ChatSidebar
                    currentUserId={currentUserId}
                    onSelectChat={handleSelectChat}
                    selectedConversationId={selectedChatId}
                    hasCommunityAccess={hasCommunityAccess}
                    hasAiAccess={hasAiAccess}
                    initialGroupChat={initialGroupChat}
                />
            </div>

            {/* Chat Window - Hidden on mobile if no chat selected */}
            <div className={cn(
                "flex-1 h-full bg-[#f0f2f5] dark:bg-black/40 relative",
                selectedChatId ? "flex" : "hidden md:flex"
            )}>
                {selectedChatId === 'ai-coach' ? (
                    <div className="w-full h-full flex flex-col">
                        <AIChatInterface onBack={() => setSelectedChatId(null)} />
                    </div>
                ) : selectedChatId && selectedChatInfo ? (
                    <div className="w-full h-full flex flex-col">
                        <ChatWindow
                            key={selectedChatId}
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

            {/* TERMS MODAL OVERLAY - Moved OUTSIDE the inner divs */}
            {showTermsModal && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                {isAiTerms ? "AI Assistant Terms of Use" : "Community Guidelines"}
                            </h3>
                        </div>

                        <div className="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
                            {isAiTerms ? (
                                <>
                                    <p><strong>Please review and accept our AI Chat Terms before proceeding:</strong></p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Accuracy:</strong> The AI Assistant may produce inaccurate information about people, places, or facts. Always verify important information.</li>
                                        <li><strong>Advice:</strong> Do not rely on the AI for medical, legal, financial, or other professional advice.</li>
                                        <li><strong>Privacy:</strong> Do not share sensitive personal information (passwords, credit cards, etc.) in your conversations.</li>
                                        <li><strong>Usage:</strong> You agree not to use the service to generate harmful, illegal, or abusive content.</li>
                                        <li><strong>Monitoring:</strong> Conversations may be reviewed for quality and safety purposes.</li>
                                    </ul>
                                    <p className="text-xs text-slate-500 mt-4">By clicking "I Agree", you acknowledge that you have read and understood these terms.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Welcome to the ADH Community! Please review our community guidelines:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-3 mb-4">
                                        <li><strong>Respect & Kindness:</strong> Treat all members with respect. Harassment, hate speech, bullying, and abusive language are strictly prohibited.</li>
                                        <li><strong>No Spam:</strong> Do not post unauthorized advertisements, promotional links, or spam.</li>
                                        <li><strong>Appropriate Content:</strong> Keep discussions relevant. Do not share inappropriate, explicit, or illegal content.</li>
                                        <li>
                                            <strong className="text-amber-600 dark:text-amber-400">Privacy (പ്രധാനം):</strong> Do not share personal information. 
                                            <div className="mt-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded p-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                                                നിങ്ങളുടെ ഫോൺ നമ്പറോ വ്യക്തിഗത വിവരങ്ങളോ ഈ ചാറ്റിൽ പങ്കുവെക്കരുത്.
                                            </div>
                                        </li>
                                        <li><strong>Reporting:</strong> Violators of these guidelines may be temporarily or permanently removed from the community.</li>
                                    </ul>
                                    <p className="text-xs text-slate-500 mt-4">By clicking "I Agree", you acknowledge that you have read and agree to follow these guidelines.</p>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setShowTermsModal(false); setPendingChatSelection(null); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAgreeTerms} disabled={loadingTerms} className="bg-indigo-600 hover:bg-indigo-700">
                                {loadingTerms ? "Processing..." : "I Agree & Continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
