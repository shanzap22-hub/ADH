"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Send, Mic, Image as ImageIcon, X, Loader2, ArrowLeft, Users, Trash2, Reply, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { uploadChatMedia } from "@/actions/chat-actions";
import { toast } from "sonner";

interface ChatWindowProps {
    conversationId: string;
    chatInfo: any;
    currentUserId: string;
    currentUserRole?: string;
    onBack: () => void;
}

export function ChatWindow({ conversationId, chatInfo, currentUserId, currentUserRole, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [inputText, setInputText] = useState("");
    const [uploading, setUploading] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const isFirstLoad = useRef(true);

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
        if (messages.length > 0) {
            scrollToBottom(isFirstLoad.current);
            isFirstLoad.current = false;
        }
    }, [messages]);

    // Fetch Messages with Sender Profile AND Reply Info
    useEffect(() => {
        setMessages([]);
        const fetchMessages = async () => {
            // 1. Fetch Raw Messages (Guaranteed to work)
            const { data: msgs, error } = await supabase
                .from("chat_messages")
                .select('*')
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (msgs) setMessages(msgs || []); // Show messages immediately while profiles load

            if (!msgs || msgs.length === 0) return;

            // 2. Fetch Profiles for Senders
            const senderIds = Array.from(new Set(msgs.map(m => m.sender_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', senderIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Simple Reply Handling (Fetch reply content if missing)
            // Optimisation: Reuse messages we already have if possible
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
                const replySender = replyRaw ? profileMap.get(replyRaw.sender_id) : null; // Try to get name from existing map

                return {
                    ...msg,
                    sender: sender,
                    reply_to: replyRaw ? { ...replyRaw, sender: replySender } : null
                };
            });

            setMessages(completeMessages);
        };
        fetchMessages();

        const channel = supabase.channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
                async (payload) => {
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
                    setMessages((prev) => [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId, supabase]);

    // Send Message
    const handleSend = async () => {
        if ((!inputText.trim() && !mediaFile) || uploading) return;

        let finalType = "text";
        let finalContent = inputText;
        let finalMediaUrl = null;

        try {
            if (mediaFile) {
                setUploading(true);
                if (mediaFile.type.startsWith("image/")) finalType = "image";
                else if (mediaFile.type.startsWith("audio/")) finalType = "audio";
                else finalType = "file";

                const formData = new FormData();
                formData.append("file", mediaFile);
                const result = await uploadChatMedia(formData);

                if (result.error) {
                    toast.error(result.error);
                    setUploading(false);
                    return;
                }

                finalMediaUrl = result.url;
                setUploading(false);
            }

            const { error } = await supabase.from("chat_messages").insert({
                conversation_id: conversationId,
                sender_id: currentUserId,
                content: finalContent,
                type: finalType,
                media_url: finalMediaUrl,
                reply_to_id: replyingTo?.id || null
            });

            if (error) {
                console.error("Supabase Insert Error:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            setInputText("");
            setMediaFile(null);
            setReplyingTo(null);

        } catch (error: any) {
            console.error("Send failed:", error);
            const errorMsg = error.hint || error.details || error.message || "Unknown error";
            toast.error("Failed to send: " + errorMsg);
            setUploading(false);
        }
    };

    // ... (Recording Logic with Improved Reliability)
    const startRecording = async () => {
        if (isRecording) return; // Prevent double-start

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
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

                    const { error } = await supabase.from("chat_messages").insert({
                        conversation_id: conversationId,
                        sender_id: currentUserId,
                        content: "",
                        type: "audio",
                        media_url: result.url,
                        reply_to_id: replyingTo?.id || null
                    });

                    if (error) throw error;

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
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={chatInfo.avatar_url} />
                    <AvatarFallback>
                        {chatInfo.is_group ? <Users className="w-5 h-5" /> : chatInfo.full_name?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{chatInfo.full_name}</h3>
                    {chatInfo.is_group && (
                        <p className="text-xs text-slate-500">Group Chat</p>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('/chat-bg-pattern.png')] bg-repeat bg-opacity-5 relative">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
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
                                <Avatar className="h-6 w-6 mr-2 mt-1 self-start">
                                    <AvatarImage src={msg.sender?.avatar_url} />
                                    <AvatarFallback className="text-[9px]">{msg.sender?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                            )}

                            <div
                                className={cn(
                                    "p-3 rounded-lg shadow-sm relative text-sm group min-w-[120px]",
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

                                {/* Media Content with Dialog for Preview */}
                                {msg.type === 'image' && msg.media_url && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="mb-2 w-[240px] h-[240px] rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-black/5">
                                                <img src={msg.media_url} alt="Image" className="w-full h-full object-cover" loading="lazy" />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none flex items-center justify-center">
                                            <div className="relative">
                                                <img
                                                    src={msg.media_url}
                                                    alt="Full Preview"
                                                    className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                                                />
                                                <a
                                                    href={msg.media_url}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs border border-white/20 transition-colors"
                                                >
                                                    Open Original
                                                </a>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
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
                                        <DropdownMenu>
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
                                                                const { error } = await supabase.from("chat_messages").delete().eq("id", msg.id);
                                                                if (error) toast.error("Failed to delete");
                                                                else toast.success("Message deleted");
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
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">

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

                {/* File Preview */}
                {mediaFile && (
                    <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 w-fit">
                        <span className="text-xs truncate max-w-[200px]">{mediaFile.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                            onClick={() => setMediaFile(null)}
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
                                if (file) setMediaFile(file);
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isRecording}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 relative">
                        {isRecording ? (
                            <div className="flex items-center justify-between h-10 px-4 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800 animate-pulse">
                                <span className="text-red-600 dark:text-red-400 font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                    Recording {formatTime(recordingTime)}...
                                </span>
                            </div>
                        ) : (
                            <Input
                                placeholder="Type a message"
                                className="rounded-full border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500 bg-slate-50 dark:bg-slate-800"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                        )}
                    </div>

                    {inputText || mediaFile ? (
                        <Button
                            onClick={handleSend}
                            disabled={uploading}
                            className="rounded-full bg-purple-600 hover:bg-purple-700 w-10 h-10 p-0 flex items-center justify-center transform hover:scale-105"
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : (
                                <Send className="w-5 h-5 text-white ml-0.5" />
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant={isRecording ? "destructive" : "secondary"}
                            className={cn(
                                "rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all duration-300",
                                isRecording ? "scale-110 shadow-lg shadow-red-500/30" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                        >
                            <Mic className={cn("w-5 h-5", isRecording ? "text-white fill-current" : "text-slate-500")} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

