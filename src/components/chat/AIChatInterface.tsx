"use client";

import { useWebSpeech } from "@/hooks/use-web-speech";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Better for chat input
import { Mic, Send, Image as ImageIcon, Loader2, Bot, StopCircle, User, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIChatInterfaceProps {
    onBack?: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    created_at?: string;
}

export function AIChatInterface({ onBack }: AIChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");

    // Voice Hook
    const { isListening, transcript, lang, setLang, startListening, stopListening, isSupported } = useWebSpeech();

    // Image State
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // FIXED: Voice Transcript Logic to prevent repetition
    // Instead of continuously appending "prev + transcript", we track the input state
    // just before the voice session started.
    const [inputBeforeVoice, setInputBeforeVoice] = useState("");

    // When voice transcript updates, we reconstruct the input
    useEffect(() => {
        if (transcript) {
            setInput((_) => {
                // If there was text before, add a space if needed
                const prefix = inputBeforeVoice ? `${inputBeforeVoice} ` : "";
                return prefix + transcript;
            });
        }
    }, [transcript, inputBeforeVoice]);

    const handleStartListening = () => {
        setInputBeforeVoice(input); // Capture what's already typed
        startListening();
    };

    const toggleLanguage = () => {
        const newLang = lang === "en-US" ? "ml-IN" : "en-US";
        setLang(newLang);
        toast.info(`Voice Language: ${newLang === "ml-IN" ? "Malayalam 🇮🇳" : "English 🇺🇸"}`);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch('/api/chat/history');
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages) {
                        setMessages(data.messages);
                        setTimeout(scrollToBottom, 100);
                    }
                }
            } catch (error) {
                console.error('[AI Coach] Failed to load history:', error);
            }
        };

        loadHistory();
    }, []);

    // Scroll automatically when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle File Selection & Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Show Local Preview Immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setLocalImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // 2. Upload to BunnyCDN
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload/bunny", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setImageUrl(data.url); // Use the CDN URL
                toast.success("Image attached!");
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (err: any) {
            toast.error("Upload failed", { description: err.message });
            setLocalImagePreview(null); // Clear preview on error
            setImageUrl(null);
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const clearImage = () => {
        setImageUrl(null);
        setLocalImagePreview(null);
    };

    const onSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Use localImagePreview as a fallback check if upload is somehow stuck but url is seemingly there
        // But mainly we rely on imageUrl.
        const effectiveImageUrl = imageUrl;

        // Validation: Text OR Image must exist
        if ((!input.trim() && !effectiveImageUrl) || isLoading || uploading) {
            if (uploading) toast.warning("Please wait for image upload to complete.");
            return;
        }

        // Optimistic UI Update
        const tempId = Date.now().toString();
        const userMessage: Message = {
            id: tempId,
            role: 'user',
            content: input,
            image_url: effectiveImageUrl || undefined,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);

        // Save Context for Recovery
        const currentInput = input;

        // Reset Inputs
        setInput("");
        setInputBeforeVoice(""); // Reset voice context
        clearImage();
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    data: { imageUrl: effectiveImageUrl } // Send actual URL
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'AI response failed');
            }

            // Append AI response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error: any) {
            console.error('[AI Coach] Error:', error);
            toast.error('Failed to send message', { description: error.message });

            // Restore input on failure
            setInput(currentInput);
            if (effectiveImageUrl) {
                setImageUrl(effectiveImageUrl);
                setLocalImagePreview(effectiveImageUrl); // Optimistic best effort restore
            }

            // Remove optimistic message
            setMessages(prev => prev.filter(m => m.id !== tempId));

        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
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
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-700 mb-2">Hello! How can I help you?</h3>
                            <p className="text-sm max-w-xs">Ask doubts, upload screenshots, or get course guidance.</p>
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
                                {m.image_url && (
                                    <div className="mb-3 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-white/10">
                                        <img
                                            src={m.image_url}
                                            alt="Attached"
                                            className="max-h-60 w-auto object-contain rounded"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
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

                    {/* Image Preview Area */}
                    {(localImagePreview || imageUrl) && (
                        <div className="relative inline-block group animate-in zoom-in duration-200">
                            <img
                                src={localImagePreview || imageUrl!}
                                alt="Preview"
                                className="h-20 w-auto rounded-lg border shadow-sm object-cover bg-slate-100"
                            />
                            {uploading ? (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            ) : (
                                <button
                                    onClick={clearImage}
                                    className="absolute -top-2 -right-2 bg-slate-500 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-all transform hover:scale-110"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => onSubmit(e)}
                        className="flex gap-2 items-end bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-10 w-10"
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
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleFileChange}
                        />

                        <div className="relative flex-1">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Type or speak in ${lang === 'ml-IN' ? 'Malayalam' : 'English'}...`}
                                className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none py-2.5"
                                disabled={isLoading}
                                autoFocus
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                        </div>

                        {isSupported && (
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-10 px-2 text-slate-500 hover:bg-slate-100"
                                    onClick={toggleLanguage}
                                    title="Switch Language"
                                >
                                    {lang === 'en-US' ? '🇺🇸 ENG' : '🇮🇳 MAL'}
                                </Button>
                                <Button
                                    type="button"
                                    variant={isListening ? "destructive" : "ghost"}
                                    size="icon"
                                    className={cn("shrink-0 rounded-full h-10 w-10", isListening ? "animate-pulse shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-red-500 hover:bg-red-50")}
                                    onClick={isListening ? stopListening : handleStartListening}
                                    title={isListening ? "Stop Recording" : "Start Voice Input"}
                                >
                                    {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </Button>
                            </div>
                        )}

                        {(input.trim() || imageUrl) && (
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || uploading}
                                className={cn(
                                    "shrink-0 transition-all rounded-full h-10 w-10 shadow-lg shadow-indigo-500/20",
                                    "bg-indigo-600 hover:bg-indigo-700 text-white"
                                )}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                            </Button>
                        )}
                    </form>
                    <div className="text-[10px] text-center text-slate-400">
                        Zero-Cost Voice • Powered by ADH AI
                    </div>
                </div>
            </div>
        </div >
    )
}
