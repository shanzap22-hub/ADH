"use client";

import { useChat } from "@ai-sdk/react";
import { useWebSpeech } from "@/hooks/use-web-speech";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Image as ImageIcon, Loader2, Bot, StopCircle, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIChatInterfaceProps {
    onBack?: () => void;
}

export function AIChatInterface({ onBack }: AIChatInterfaceProps) {
    // 1. Vercel AI SDK (using sendMessage, not append in AI SDK 4.0)
    const { messages, sendMessage, status } = useChat({
        api: "/api/chat",
        onError: (err) => {
            toast.error("AI Coach Error", { description: err.message });
        },
        initialMessages: []
    });

    const isLoading = status === 'in_progress' || status === 'pending';

    // 2. Local input state (AI SDK 4.0's useChat input state doesn't update reliably)
    const [input, setInput] = useState("");

    // 2. Voice Hook
    const { isListening, transcript, startListening, stopListening, isSupported } = useWebSpeech();

    // 3. Image State
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync Voice Transcript to Input
    useEffect(() => {
        if (transcript) {
            setInput(prev => prev ? prev + " " + transcript : transcript);
        }
    }, [transcript]);

    // Scroll User to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle File Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload/bunny", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setImageUrl(data.url);
                toast.success("Image attached!");
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (err: any) {
            toast.error("Upload failed", { description: err.message });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() && !imageUrl) return; // Don't send empty

        try {
            // Use sendMessage from useChat (AI SDK 4.0)
            await sendMessage({
                role: 'user',
                content: input,
                experimental_attachments: imageUrl ? [{ url: imageUrl, contentType: 'image/*' }] : undefined
            });

            // Clear input after sending
            setInput("");
            setImageUrl(null);
        } catch (error) {
            console.error('[AI Coach] Error in onSubmit:', error);
            toast.error('Failed to send message', { description: String(error) });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Header */}
            <header className="h-16 border-b flex items-center px-4 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2 text-slate-500"
                            onClick={onBack}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center border border-indigo-200">
                        <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            ADH AI Coach
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">BETA</span>
                        </h1>
                        <p className="text-xs text-slate-500">Your personal course facilitator</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-black/20">
                <div className="space-y-6 max-w-3xl mx-auto pb-4 pt-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-700 mb-2">Hello! Only You can see this chat.</h3>
                            <p className="text-sm max-w-xs">Use voice or text to ask me doubt, upload screenshots, or get course guidance.</p>
                        </div>
                    )}

                    {messages.map(m => (
                        <div key={m.id} className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                                m.role === "user" ? "bg-slate-200" : "bg-indigo-100"
                            )}>
                                {m.role === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "rounded-2xl px-5 py-3 max-w-[80%] text-sm shadow-sm",
                                m.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 rounded-tl-none"
                            )}>
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 flex items-center shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
                                <span className="text-xs text-slate-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-slate-900 shrink-0">
                <div className="max-w-3xl mx-auto space-y-2">
                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="relative inline-block group">
                            <img src={imageUrl} alt="Upload" className="h-20 w-auto rounded-lg border shadow-sm object-cover" />
                            <button
                                onClick={() => setImageUrl(null)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="flex gap-2 items-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || isLoading}
                            title="Upload Image"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="relative flex-1">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="pr-10 min-h-[44px]"
                                disabled={isLoading}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e as any); } }}
                            />
                        </div>

                        {isSupported && (
                            <Button
                                type="button"
                                variant={isListening ? "destructive" : "outline"}
                                size="icon"
                                className={cn("shrink-0", isListening ? "animate-pulse" : "text-slate-500")}
                                onClick={isListening ? stopListening : startListening}
                                title={isListening ? "Stop Recording" : "Start Voice Input"}
                            >
                                {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>
                        )}

                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || (!input && !imageUrl)}
                            className={cn(
                                "shrink-0 transition-all border",
                                input || imageUrl
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-400 border-slate-300"
                            )}
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </form>
                    <div className="text-[10px] text-center text-slate-400">
                        Zero-Cost Voice • Powered by ADH AI
                    </div>
                </div>
            </div>
        </div >
    )
}
