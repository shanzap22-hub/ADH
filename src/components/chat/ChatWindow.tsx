"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import Image from "next/image"; // Removed unused import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Image as ImageIcon, X, Loader2, ArrowLeft, Users, Trash2, Reply, MoreHorizontal, Bell, BellOff, RefreshCw, ZoomIn } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { deleteChatMessage, sendChatMessage, toggleChatMute, getChatMuteStatus, uploadChatMedia } from "@/actions/chat-actions";
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChatWindowProps {
    conversationId: string;
    chatInfo: any;
    currentUserId: string;
    currentUserRole?: string;
    onBack: () => void;
}

export function ChatWindow({ conversationId, chatInfo, currentUserId, currentUserRole, onBack }: ChatWindowProps) {
    console.log('[ChatWindow] 🔥 Component rendering!', { conversationId, currentUserId });

    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [inputText, setInputText] = useState("");
    const [uploading, setUploading] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isCancelledRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedImage, setSelectedImageState] = useState<string | null>(null);

    // Wrapper to handle history state for full screen image
    const setSelectedImage = (url: string | null, e?: React.MouseEvent | React.TouchEvent) => {
        // Stop propagation if event is provided to prevent bubbling to parent elements
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (url) {
            // Opening image: Push history state with a unique identifier
            const state = { imageOpen: true, id: Date.now() };
            window.history.pushState(state, "", window.location.href);
            setSelectedImageState(url);
        } else {
            // Closing start
            // We need to differentiate between "Browser Back" and "Manual Close (X / Background)"

            // If this function is called, it means meaningful user interaction (click).
            // We should try to revert the history state we pushed, so the "Forward" button doesn't take us back to the image.

            // However, checking history state is tricky.
            // If we just `setSelectedImageState(null)`, the history state remains "open". 
            // Then hitting "Back" might not match what we expect (it might go back to dashboard if we weren't careful, or it might just close the "already closed" image).

            // SAFE APPROACH for "X" button given the bug:
            // Just close the image state. Do NOT touch history.
            // If the user hits "Back" later, it will likely pop the "imageOpen" state and result in... nothing visible changing (which is fine),
            // OR it will go back to the previous page (Dashboard), which is also acceptable for a "Back" press after closing a modal.

            // The priority is: X BUTTON MUST NOT REDIRECT.
            setSelectedImageState(null);

            // Optional: If we are SURE we are at the top of the stack with imageOpen, we could back().
            // But let's trust the user's report that previous attempts failed.
            // We'll leave the history stack "dirty" (one extra entry) rather than risking a redirect.
        }
    };

    // Listen for PopState (Back Button)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If the user presses Back, the browser pops the state.
            // We just need to sync our local state.
            // If we are currently showing an image, this pop means we should close it.
            // The event.state will be the state of the *previous* entry (or new current),
            // which likely doesn't have imageOpen: true if we just went back.

            setSelectedImageState((current) => {
                if (current) {
                    return null; // Close image on back press
                }
                return current;
            });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Memoize the client to prevent recreation on every render
    const [supabase] = useState(() => {
        console.log('[ChatWindow] 📞 Initializing Supabase client...');
        return createClient();
    });

    const isFirstLoad = useRef(true);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        getChatMuteStatus(conversationId).then(setIsMuted);
    }, [conversationId]);

    const handleToggleMute = async (checked: boolean) => {
        setIsMuted(checked); // Optimistic UI update

        try {
            // 1. Update Database
            const result = await toggleChatMute(conversationId, checked);
            if (result.error) throw new Error(result.error);

            // 2. Update OneSignal Tags (Native Only)
            if (Capacitor.isNativePlatform()) {
                console.log(`Attempting to update OneSignal Tag: muted_chat_${conversationId} = ${checked}`);

                try {
                    const OneSignalModule = await import('onesignal-cordova-plugin');
                    const OneSignal = OneSignalModule.default;

                    if (!OneSignal) {
                        console.error("OneSignal module not found during mute toggle");
                        return;
                    }

                    const tagKey = `muted_chat_${conversationId}`;

                    if (checked) {
                        // MUTE: Add Tag
                        if (OneSignal.User && typeof OneSignal.User.addTag === 'function') {
                            OneSignal.User.addTag(tagKey, "true");
                            console.log(`OneSignal Tag Added: ${tagKey}`);
                        } else if ((OneSignal as any).sendTag) {
                            // Fallback for older versions
                            (OneSignal as any).sendTag(tagKey, "true");
                        } else {
                            console.warn("OneSignal.User.addTag not available");
                        }
                    } else {
                        // UNMUTE: Remove Tag
                        if (OneSignal.User && typeof OneSignal.User.removeTag === 'function') {
                            OneSignal.User.removeTag(tagKey);
                            console.log(`OneSignal Tag Removed: ${tagKey}`);
                        } else if ((OneSignal as any).deleteTag) {
                            // Fallback for older versions
                            (OneSignal as any).deleteTag(tagKey);
                        } else {
                            console.warn("OneSignal.User.removeTag not available");
                        }
                    }
                } catch (osError) {
                    console.error("OneSignal Tag Update Critical Fail:", osError);
                    // We don't revert UI for this, as DB update succeeded.
                    // But we might want to tell the user notifications might still come?
                }
            }

            toast.success(checked ? "Notifications muted" : "Notifications enabled");

        } catch (error: any) {
            console.error("Mute Toggle Error:", error);
            setIsMuted(!checked); // Revert UI
            toast.error("Failed to update settings");
        }
    };

    const scrollToBottom = (instant = false) => {
        messagesEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    };

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-purple-500', 'transition-all', 'duration-300');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-purple-500');
            }, 2000);
        }
    };

    useEffect(() => {
        if (messages.length > 0 && isFirstLoad.current) {
            scrollToBottom(true);
            isFirstLoad.current = false;
        }
    }, [messages]);

    // define fetchMessagesRef at top level to be accessible by handleScroll
    const fetchMessagesRef = useRef<(userId: string, beforeDate?: string) => Promise<void>>(async () => { });

    // Main Effect: Fetch Initial Messages & Subscribe
    useEffect(() => {
        let isMounted = true;

        // Use a unique channel key to prevent collisions with previous unmounted instances (zombie channels)
        const channelKey = `chat:${conversationId}:${Date.now()}`;
        console.log(`[ChatWindow] 🔌 Creating channel: ${channelKey}`);
        const channel = supabase.channel(channelKey);

        const fetchMessages = async (userId: string, beforeDate?: string) => {
            if (!isMounted) return;
            console.log('[ChatWindow] 📥 Fetching messages...', { conversationId, beforeDate });

            if (beforeDate) setIsLoadingMore(true);

            // 1. Fetch Raw Messages (Newest First)
            let query = supabase
                .from("chat_messages")
                .select('*')
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: false })
                .limit(50);

            if (beforeDate) {
                query = query.lt("created_at", beforeDate);
            }

            const { data: msgs, error } = await query;

            if (error) {
                console.error("[CHAT_FETCH_ERROR] ❌ Failed to load messages:", error);
                if (isMounted) setIsLoadingMore(false);
                return;
            }

            if (!msgs || msgs.length === 0) {
                console.log('[ChatWindow] 📭 No messages found');
                if (!beforeDate && isMounted) setMessages([]);
                if (beforeDate && isMounted) setHasMore(false);
                if (isMounted) setIsLoadingMore(false);
                return;
            }

            console.log(`[ChatWindow] ✅ Loaded ${msgs.length} messages`);

            if (msgs.length < 50) {
                if (isMounted) setHasMore(false);
            }

            // 2. Fetch Profiles for Senders
            const senderIds = Array.from(new Set(msgs.map(m => m.sender_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', senderIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Simple Reply Handling
            const replyIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id);
            const { data: replies } = await supabase
                .from('chat_messages')
                .select('id, content, type, sender_id')
                .in('id', replyIds);

            const replyMap = new Map(replies?.map(r => [r.id, r]));

            // 4. Merge Data
            const completeMessages = msgs.map(msg => {
                const sender = profileMap.get(msg.sender_id);
                const replyRaw = msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null;
                const replySender = replyRaw ? profileMap.get(replyRaw.sender_id) : null;

                return {
                    ...msg,
                    sender: sender,
                    reply_to: replyRaw ? { ...replyRaw, sender: replySender } : null
                };
            }).reverse(); // Reverse to show Oldest -> Newest

            if (isMounted) {
                if (beforeDate) {
                    setMessages(prev => [...completeMessages, ...prev]);
                    setIsLoadingMore(false);
                } else {
                    setMessages(completeMessages);
                    // Scroll to bottom on initial load
                    setTimeout(() => scrollToBottom(true), 100);
                }
            }
        };

        // expose fetchMessages to ref
        fetchMessagesRef.current = fetchMessages;

        const setupSubscription = () => {
            console.log('[SUBSCRIPTION] 📡 Setting up real-time subscription...', channelKey);

            channel
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
                    async (payload) => {
                        console.log('[REALTIME_DEBUG] 🔔 New message received:', payload.new.id);

                        const { data: senderProfile } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('id', payload.new.sender_id)
                            .single();

                        let replyInfo = null;
                        if (payload.new.reply_to_id) {
                            const { data: replyData } = await supabase
                                .from('chat_messages')
                                .select(`id, content, type, sender:profiles(full_name)`)
                                .eq('id', payload.new.reply_to_id)
                                .single();
                            replyInfo = replyData;
                        }

                        const newMessage = { ...payload.new, sender: senderProfile, reply_to: replyInfo };

                        if (isMounted) {
                            setMessages((prev) => {
                                if (prev.some(m => m.id === newMessage.id)) return prev;
                                return [...prev, newMessage];
                            });

                            if (payload.new.sender_id === currentUserId) {
                                setTimeout(() => scrollToBottom(), 100);
                            }
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`[SUBSCRIPTION] 📊 Status (${channelKey}):`, status);
                });
        };

        const initChat = async () => {
            // 1. Initial Load from Props if available, or fetch session
            // We use props.currentUserId so we don't strictly need getSession, but it's safer for token check
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchMessages(session.user.id);
                setupSubscription();
            } else {
                console.warn('[ChatWindow] ⚠️ No session found in initChat');
            }
        };

        initChat();

        return () => {
            console.log(`[ChatWindow] 🧹 Cleaning up channel: ${channelKey}`);
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase, currentUserId]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        // Check if scrolled to top
        if (scrollTop === 0 && !isLoadingMore && hasMore && messages.length > 0) {
            const oldestMessage = messages[0];
            const beforeDate = oldestMessage.created_at;
            console.log('Load more triggered. Oldest msg date:', beforeDate);

            // Trigger fetch via ref
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    fetchMessagesRef.current(session.user.id, beforeDate);
                }
            });
        }
    };

    // Handle Image Pick with Platform Detection
    const handleImagePick = async () => {
        console.log('[IMAGE_PICK] 📸 Button clicked!');
        console.log('[IMAGE_PICK] Platform check:', {
            isNative: Capacitor.isNativePlatform(),
            platform: Capacitor.getPlatform()
        });

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[IMAGE_PICK] 📱 Using native Camera API...');

                // Use native Camera API for mobile
                const image = await Camera.getPhoto({
                    quality: 80,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Photos, // Gallery only
                });

                console.log('[IMAGE_PICK] ✅ Camera.getPhoto returned:', {
                    webPath: image.webPath,
                    format: image.format,
                    saved: image.saved
                });

                if (!image.webPath) {
                    console.error('[IMAGE_PICK] ❌ No webPath in image!');
                    toast.error("Failed to load image");
                    return;
                }

                console.log('[IMAGE_PICK] 🔄 Converting to File object...');

                // Convert to File object
                const response = await fetch(image.webPath);
                console.log('[IMAGE_PICK] Fetch response:', { ok: response.ok, status: response.status });

                const blob = await response.blob();
                console.log('[IMAGE_PICK] Blob created:', { size: blob.size, type: blob.type });

                const file = new File([blob], `image.${image.format || 'jpg'}`, {
                    type: `image/${image.format || 'jpeg'}`
                });
                console.log('[IMAGE_PICK] File created:', { name: file.name, size: file.size, type: file.type });

                setMediaFile(file);
                setImagePreview(image.webPath);
                console.log('[IMAGE_PICK] ✅ Image attached successfully!');
                toast.success("Image attached!");
            } else {
                console.log('[IMAGE_PICK] 🌐 Using web file input...');
                // Use file input for web
                fileInputRef.current?.click();
            }
        } catch (error: any) {
            console.error('[IMAGE_PICK] ❌ ERROR:', error);
            console.error('[IMAGE_PICK] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            if (error.message && !error.message.includes('User cancelled')) {
                toast.error("Failed to pick image: " + error.message);
            } else {
                console.log('[IMAGE_PICK] User cancelled image selection');
            }
        }
    };



    // Manual Refresh for Debugging
    const manualRefresh = async () => {
        console.log('[MANUAL_REFRESH] 🔄 Refreshing messages...');
        toast.loading("Refreshing...", { id: 'refresh' });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchMessagesRef.current(session.user.id);
            toast.success("Refreshed!", { id: 'refresh' });
        } else {
            toast.error("Not authenticated", { id: 'refresh' });
        }
    };

    // Send Message
    const handleSend = async () => {
        if ((!inputText.trim() && !mediaFile) || uploading) return;

        const tempId = uuidv4();
        console.log('[SEND] 🚀 Starting send...', { tempId, hasMedia: !!mediaFile, text: inputText.slice(0, 20) });

        let finalType = "text";
        let finalContent = inputText;
        let finalMediaUrl = null;

        // Optimistic Update
        const optimisticMessage = {
            id: tempId,
            content: finalContent,
            type: mediaFile ? (mediaFile.type.startsWith("image/") ? "image" : mediaFile.type.startsWith("audio/") ? "audio" : "file") : "text",
            media_url: imagePreview, // Use preview for immediate display
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
            sender: null, // 'me' doesn't look at sender object usually
            reply_to: replyingTo
        };

        // Add optimistic message immediately
        setMessages(prev => [...prev, optimisticMessage]);

        // Clear input immediately
        setInputText("");
        setMediaFile(null);
        setImagePreview(null);
        setReplyingTo(null);

        // Auto-scroll
        setTimeout(() => scrollToBottom(), 100);

        try {
            if (mediaFile) {
                console.log('[UPLOAD] 📤 Starting upload...', { name: mediaFile.name, size: mediaFile.size });
                toast.loading("Uploading image...", { id: 'upload' });
                setUploading(true);

                if (mediaFile.type.startsWith("image/")) finalType = "image";
                else if (mediaFile.type.startsWith("audio/")) finalType = "audio";
                else finalType = "file";

                const formData = new FormData();
                formData.append("file", mediaFile);

                // Use API route instead of server action (same as AI Chat)
                const res = await fetch('/api/upload/bunny?folder=chat-media', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error('[UPLOAD] ❌ Upload failed:', errorData);
                    toast.error("Upload failed", { id: 'upload' });
                    // Remove optimistic message on failure
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    throw new Error(errorData.error || 'Upload failed');
                }

                const data = await res.json();
                finalMediaUrl = data.url;

                // Update optimistic message with real URL if needed
                if (finalMediaUrl) {
                    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, media_url: finalMediaUrl } : m));
                }

                console.log('[UPLOAD] ✅ Upload complete:', finalMediaUrl);
                toast.success("Image uploaded!", { id: 'upload' });
            }

            const result = await sendChatMessage(
                conversationId,
                finalContent,
                finalType,
                finalMediaUrl,
                replyingTo?.id || null,
                tempId // Pass client-generated ID
            );

            if (result.error) throw new Error(result.error);

            // Reconcile Optimistic Message with Real Message
            if (result.data) {
                const realMessage = result.data;
                console.log('[SEND] ✅ Success. ID matches:', { tempId, realId: realMessage.id });

                setMessages(prev => {
                    // Just update timestamp/details, ID is already correct
                    return prev.map(m => m.id === tempId ? {
                        ...m,
                        created_at: realMessage.created_at,
                        // Keep optimistic sender/reply_to
                    } : m);
                });
            }

        } catch (error: any) {
            console.error('[SEND] ❌ Send failed:', error);
            const errorMsg = error.hint || error.details || error.message || "Unknown error";
            toast.error("Failed to send: " + errorMsg);
            // Revert optimistic update
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            console.log('[SEND] 🏁 Cleanup...');
            // Always reset uploading state
            setUploading(false);
        }
    };

    // ... (Recording Logic with Improved Reliability)
    const startRecording = async () => {
        if (isRecording) return; // Prevent double-start
        isCancelledRef.current = false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                // Check if cancelled
                if (isCancelledRef.current) {
                    console.log('Voice recording cancelled.');
                    stream.getTracks().forEach(track => track.stop());
                    setIsRecording(false);
                    setRecordingTime(0);
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log('Voice recording stopped. Blob size:', audioBlob.size, 'bytes');

                // Validate audio has content (at least 1KB)
                if (audioBlob.size < 1000) {
                    console.warn('Recording too short or empty, not sending');
                    toast.error('Recording too short. Please hold the button longer.');
                    stream.getTracks().forEach(track => track.stop());
                    setIsRecording(false);
                    setRecordingTime(0);
                    return;
                }

                const audioFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Auto-send the voice note
                setIsRecording(false);
                setRecordingTime(0);

                // Upload and send immediately
                try {
                    setUploading(true);
                    const formData = new FormData();
                    formData.append("file", audioFile);
                    const result = await uploadChatMedia(formData);

                    if (result.error) {
                        toast.error(result.error);
                        setUploading(false);
                        return;
                    }

                    const sendResult = await sendChatMessage(
                        conversationId,
                        "",
                        "audio",
                        result.url!,
                        replyingTo?.id || null,
                        uuidv4() // Generate ID for voice message too
                    );

                    if (sendResult.error) throw new Error(sendResult.error);

                    setReplyingTo(null);
                    setUploading(false);
                    toast.success("Voice message sent!");

                } catch (error: any) {
                    console.error("Voice send failed:", error);
                    toast.error("Failed to send voice message");
                    setUploading(false);
                }
            };

            recorder.start(100); // Request data every 100ms to ensure audio is captured
            setIsRecording(true);
        } catch (e) {
            console.error("Mic error:", e);
            toast.error("Could not access microphone");
        }
    };

    const cancelRecording = () => {
        isCancelledRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-black/20">
            {/* Header */}
            <div className="sticky top-0 flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-20">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className={cn(
                    "h-10 w-10 border border-slate-100 dark:border-slate-800",
                    chatInfo.is_group
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                        : "bg-gradient-to-br from-pink-500 to-orange-500"
                )}>
                    <AvatarImage src={chatInfo.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-transparent text-white font-bold">
                        {chatInfo.is_group ? <Users className="w-5 h-5" /> : chatInfo.full_name?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{chatInfo.full_name}</h3>
                    {chatInfo.is_group && (
                        <p className="text-xs text-slate-500">Group Chat</p>
                    )}
                </div>
                {/* Mute Toggle (Only for Group Chats) */}
                {chatInfo.is_group && (
                    <div className="ml-auto flex items-center gap-2">
                        {/* Manual Refresh Button for Debugging */}
                        <Button
                            onClick={manualRefresh}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Refresh messages"
                        >
                            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                            {isMuted ? <BellOff className="w-3.5 h-3.5 text-slate-400" /> : <Bell className="w-3.5 h-3.5 text-purple-600" />}
                            <Label htmlFor="mute-chat" className="text-[10px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hidden sm:block">
                                {isMuted ? 'Muted' : 'Notifications'}
                            </Label>
                            <Switch
                                id="mute-chat"
                                checked={isMuted}
                                onCheckedChange={handleToggleMute}
                                className="scale-75 data-[state=checked]:bg-purple-600"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('/chat-bg-pattern.png')] bg-repeat bg-opacity-5 relative"
                onScroll={handleScroll}
            >
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;

                    // Debug: Log image messages
                    if (msg.type === 'image') {
                        console.log('[RENDER] Image message:', { id: msg.id, media_url: msg.media_url, type: msg.type });
                    }

                    return (
                        <div
                            key={msg.id}
                            id={`msg-${msg.id}`}
                            className={cn(
                                "flex max-w-[80%] mb-2",
                                isMe ? "ml-auto justify-end" : "mr-auto justify-start"
                            )}
                        >
                            {!isMe && chatInfo.is_group && (
                                <Avatar className="h-6 w-6 mr-2 mt-1 self-start flex-shrink-0">
                                    <AvatarImage src={msg.sender?.avatar_url} />
                                    <AvatarFallback className="text-[9px]">{msg.sender?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                            )}

                            <div
                                className={cn(
                                    "p-3 rounded-lg shadow-sm relative text-sm group min-w-[120px] max-w-full overflow-hidden",
                                    isMe
                                        ? "bg-purple-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700"
                                )}
                            >
                                {/* Reply Context */}
                                {msg.reply_to && (
                                    <div
                                        onClick={() => scrollToMessage(msg.reply_to.id)}
                                        className={cn(
                                            "mb-2 p-2 rounded text-xs border-l-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity",
                                            isMe ? "bg-purple-700 border-purple-300 text-purple-100" : "bg-slate-100 dark:bg-slate-700 border-purple-500 text-slate-600 dark:text-slate-300"
                                        )}>
                                        <p className="font-bold mb-0.5">{msg.reply_to.sender?.full_name || msg.reply_to.sender?.email?.split('@')[0] || 'User'}</p>
                                        <p className="truncate max-w-[200px]">
                                            {msg.reply_to.type === 'image' ? 'ðŸ“· Image' :
                                                msg.reply_to.type === 'audio' ? 'ðŸŽ¤ Voice Note' :
                                                    msg.reply_to.content}
                                        </p>
                                    </div>
                                )}

                                {/* Sender Name in Group Chat */}
                                {!isMe && chatInfo.is_group && (
                                    <p className="text-[10px] font-bold text-orange-500 mb-1">
                                        {msg.sender?.full_name || msg.sender?.email?.split('@')[0] || "User"}
                                    </p>
                                )}

                                {/* Media Content with Dialog for Preview - DISABLED for debug */}
                                {msg.type === 'image' && msg.media_url && (
                                    <>
                                        <div
                                            className="mb-2 w-full max-w-[240px] aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-black/5 relative"
                                            onClick={(e) => setSelectedImage(msg.media_url, e)}
                                        >
                                            <img
                                                src={msg.media_url}
                                                alt="Image"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </>
                                )}

                                {msg.type === 'audio' && msg.media_url && (
                                    <audio controls src={msg.media_url} className="mb-2 h-8 w-[200px]" />
                                )}

                                {/* Text Content */}
                                {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                                {/* Metadata & Actions */}
                                <div className="flex items-center justify-end gap-2 mt-1">
                                    <span className={cn("text-[10px] opacity-70", isMe ? "text-purple-100" : "text-slate-400")}>
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                    </span>

                                    {/* Action Menu */}
                                    <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className={cn("w-4 h-4", isMe ? "text-purple-200 hover:text-purple-100" : "text-slate-400 hover:text-slate-600")} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align={isMe ? "end" : "start"}>
                                                <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                    <Reply className="w-4 h-4 mr-2" />
                                                    Reply
                                                </DropdownMenuItem>
                                                {(isMe || ['admin', 'super_admin', 'instructor'].includes(currentUserRole || '')) && (
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            if (confirm("Delete this message?")) {
                                                                const result = await deleteChatMessage(msg.id);
                                                                if (result.error) toast.error("Failed to delete: " + result.error);
                                                                else {
                                                                    toast.success("Message deleted");
                                                                    // Optimistic update of UI: Remove message immediately
                                                                    setMessages(prev => prev.filter(m => m.id !== msg.id));
                                                                }
                                                            }
                                                        }}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 pb-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">

                {/* Replying Banner */}
                {replyingTo && (
                    <div className="flex items-center justify-between p-2 mb-2 bg-slate-50 dark:bg-slate-800 border-l-4 border-purple-500 rounded-r-lg animate-in slide-in-from-bottom-2">
                        <div className="text-sm">
                            <span className="font-semibold text-purple-600 dark:text-purple-400">Replying to {replyingTo.sender?.full_name}</span>
                            <p className="text-xs text-slate-500 truncate max-w-[300px]">
                                {replyingTo.type === 'image' ? 'ðŸ“· Image' : replyingTo.type === 'audio' ? 'ðŸŽ¤ Voice Note' : replyingTo.content}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0 rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Image Preview */}
                {(mediaFile && imagePreview) && (
                    <div className="mb-2 relative inline-block group">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-20 w-auto rounded-lg border shadow-sm object-cover bg-slate-100"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 bg-slate-500 hover:bg-red-500 text-white rounded-full shadow-md"
                            onClick={() => {
                                setMediaFile(null);
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}

                {/* File Preview (for non-image files) */}
                {(mediaFile && !imagePreview) && (
                    <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 w-fit">
                        <span className="text-xs truncate max-w-[200px]">{mediaFile.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                            onClick={() => {
                                setMediaFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setMediaFile(file);
                                    // Create preview for web
                                    const preview = URL.createObjectURL(file);
                                    setImagePreview(preview);
                                }
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                            onClick={handleImagePick}
                            disabled={isRecording || uploading}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center px-4 py-2 min-h-[44px]">
                        {isRecording ? (
                            <div className="flex items-center gap-3 w-full animate-in fade-in duration-200">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums flex-1">
                                    {formatTime(recordingTime)}
                                </span>
                                <span className="text-xs text-slate-500 animate-pulse hidden sm:inline-block">Recording...</span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelRecording}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 h-8"
                                >
                                    <Trash2 className="w-4 h-4 mr-1.5" />
                                    <span className="text-xs font-medium">Cancel</span>
                                </Button>
                            </div>
                        ) : (
                            <Input
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 h-auto resize-none max-h-32 text-base"
                            />
                        )}
                    </div>

                    {/* Send / Mic Button */}
                    <Button
                        size="icon"
                        className={cn(
                            "rounded-full shrink-0 transition-all duration-200",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 scale-110"
                                : (inputText.trim() || mediaFile)
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600"
                        )}
                        onClick={isRecording ? stopRecording : (inputText.trim() || mediaFile ? handleSend : startRecording)}
                        disabled={uploading}
                    >
                        {isRecording ? (
                            <Send className="w-5 h-5 text-white" /> // Icon changes to Send to indicate "finish recording"
                        ) : (inputText.trim() || mediaFile) ? (
                            uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Full Screen Image Overlay */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={(e) => setSelectedImage(null, e)}
                    >
                        <div className="relative max-w-full max-h-full">
                            <img
                                src={selectedImage}
                                alt="Full Preview"
                                className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
                                onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                            />
                            <Button
                                className="absolute -top-12 right-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                size="icon"
                                onClick={(e) => setSelectedImage(null, e)}
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
