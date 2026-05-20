"use client";

import { useWebSpeech } from "@/hooks/use-web-speech";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Image as ImageIcon, Loader2, Bot, StopCircle, User, ArrowLeft, X, Copy, Check } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadToR2 } from "@/actions/r2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIChatInterfaceProps {
    onBack?: () => void;
    onClose?: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    created_at?: string;
}

export function AIChatInterface({ onBack, onClose }: AIChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");
    const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

    // Voice Hook
    const { isListening, transcript, startListening, stopListening, isSupported } = useWebSpeech();
    const [lang, setLang] = useState<'en-US' | 'ml-IN'>('en-US');
    const inputBeforeSpeech = useRef<string>("");

    // Image State
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Capture input state when starting to listen
    useEffect(() => {
        if (isListening) {
            inputBeforeSpeech.current = input;
        }
    }, [isListening]);

    // Sync Voice Transcript to Input
    useEffect(() => {
        if (isListening && transcript) {
            const prefix = inputBeforeSpeech.current;
            const spacer = prefix && !prefix.endsWith(" ") ? " " : "";
            setInput(prefix + spacer + transcript);
        }
    }, [transcript, isListening]);

    // Auto-resize textarea when input changes
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(`/api/chat/history?t=${new Date().getTime()}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages) {
                        setMessages(data.messages);
                        setTimeout(() => scrollToBottom("auto"), 100);
                    }
                }
            } catch (error) {
                console.error('[AI Coach] Failed to load history:', error);
            }
        };

        loadHistory();
    }, [scrollToBottom]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle File Selection & Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Show Local Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setLocalImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // 2. Upload to R2/CDN
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadToR2(formData, "ai-coach-media");

            if (result.url) {
                setImageUrl(result.url);
                toast.success("Image attached!");
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                    }
                }, 100);
            } else {
                // BUG FIX: 'data' → 'result' (was causing ReferenceError)
                throw new Error(result.error || "Upload failed");
            }
        } catch (err: any) {
            toast.error("Upload failed", { description: err.message });
            setLocalImagePreview(null);
            setImageUrl(null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const clearImage = () => {
        setImageUrl(null);
        setLocalImagePreview(null);
    };

    // Copy AI message to clipboard
    const handleCopyMessage = (msgId: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedMsgId(msgId);
        toast.success("Copied!");
        setTimeout(() => setCopiedMsgId(null), 2000);
    };

    const onSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if ((!input.trim() && !imageUrl) || isLoading || uploading) return;

        // Optimistic UI Update
        const tempId = Date.now().toString();
        const userMessage: Message = {
            id: tempId,
            role: 'user',
            content: input,
            image_url: imageUrl || undefined,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);

        // Save Context for error recovery
        const currentInput = input;
        const currentImageUrl = imageUrl;

        // Reset Inputs
        setInput("");
        clearImage();
        setIsLoading(true);

        // Add placeholder AI message for streaming
        const aiTempId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: aiTempId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        }]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    data: { imageUrl: currentImageUrl }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle daily limit reached
                if (response.status === 429 && errorData.limitReached) {
                    toast.error(`Daily limit reached (${errorData.limit}/day)`, {
                        description: "Please try again tomorrow."
                    });
                }

                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            // --- STREAMING RESPONSE HANDLING ---
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Update the placeholder AI message with accumulated text
                setMessages(prev =>
                    prev.map(m =>
                        m.id === aiTempId
                            ? { ...m, content: fullText }
                            : m
                    )
                );
            }

            // If somehow empty response
            if (!fullText.trim()) {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === aiTempId
                            ? { ...m, content: "Sorry, I couldn't generate a response. Please try again." }
                            : m
                    )
                );
            }

        } catch (error: any) {
            console.error('[AI Coach] Error:', error);
            toast.error('Failed to send message', { description: error.message });

            // Restore input on failure
            setInput(currentInput);
            if (currentImageUrl) {
                setImageUrl(currentImageUrl);
                setLocalImagePreview(currentImageUrl);
            }

            // Remove optimistic messages
            setMessages(prev => prev.filter(m => m.id !== tempId && m.id !== aiTempId));

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

    // --- STARTER PROMPTS (empty state) ---
    const starterPrompts = [
        "📱 Meta Ads-ൽ ഒരു Campaign സെറ്റപ്പ് ചെയ്യാൻ എന്ത് ചെയ്യണം?",
        "🤖 AI Tools ഉപയോഗിച്ച് Content Create ചെയ്യാൻ സഹായിക്കൂ",
        "📊 Digital Marketing-ന്റെ Basics explain ചെയ്യൂ",
        "🎯 Course Module-ൽ doubt ഉണ്ട്, help വേണം"
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2 text-slate-500"
                            onClick={onBack}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-pink-500/20">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            ADH AI Coach
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">BETA</span>
                        </h1>
                        <p className="text-xs text-slate-500">Your personal Program facilitator</p>
                    </div>
                </div>
                {onClose && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-full w-9 h-9 flex items-center justify-center"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-black/20">
                <div className="space-y-6 max-w-3xl mx-auto pb-4 pt-4">

                    {/* Empty State with Starter Prompts */}
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center text-slate-500 mt-12 flex flex-col items-center">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-2">Hello! How can I help you?</h3>
                            <p className="text-sm max-w-xs mb-6">Ask doubts, upload screenshots, or get Program guidance.</p>

                            {/* Starter Prompt Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                                {starterPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInput(prompt);
                                            setTimeout(() => textareaRef.current?.focus(), 50);
                                        }}
                                        className="text-left text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map(m => (
                        <div key={m.id} className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                                m.role === "user" ? "bg-slate-200 dark:bg-slate-700" : "bg-indigo-100 dark:bg-indigo-900/30"
                            )}>
                                {m.role === "user" ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "rounded-2xl px-5 py-3 max-w-[85%] text-sm shadow-sm relative group",
                                m.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                            )}>
                                {/* Image */}
                                {m.image_url && (
                                    <div className="mb-3 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-white/10 relative">
                                        <Image
                                            src={m.image_url}
                                            alt="Attached"
                                            width={0}
                                            height={0}
                                            sizes="100vw"
                                            className="max-h-60 w-auto object-contain rounded"
                                            style={{ width: 'auto', height: 'auto' }}
                                        />
                                    </div>
                                )}

                                {/* Content: Markdown for AI, plain text for User */}
                                {m.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert prose-slate max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-xs prose-pre:bg-slate-900 prose-pre:dark:bg-slate-950 prose-code:before:content-none prose-code:after:content-none break-words">
                                        {m.content ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Custom code block with copy button
                                                    pre: ({ children }) => (
                                                        <div className="relative group/code">
                                                            <pre className="!rounded-lg !text-xs overflow-x-auto">{children}</pre>
                                                        </div>
                                                    ),
                                                    // Inline code styling
                                                    code: ({ children, className }) => {
                                                        const isBlock = className?.includes('language-');
                                                        if (isBlock) {
                                                            return <code className={cn(className, "text-xs")}>{children}</code>;
                                                        }
                                                        return (
                                                            <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400">
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                    // Links open in new tab
                                                    a: ({ href, children }) => (
                                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            {children}
                                                        </a>
                                                    )
                                                }}
                                            >
                                                {m.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <span className="text-slate-400 italic">Thinking...</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap leading-relaxed break-words">{m.content}</div>
                                )}

                                {/* Copy button for AI messages */}
                                {m.role === "assistant" && m.content && (
                                    <button
                                        onClick={() => handleCopyMessage(m.id, m.content)}
                                        className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full p-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                                        title="Copy message"
                                    >
                                        {copiedMsgId === m.id ? (
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Streaming indicator (shown while loading and no AI content yet) */}
                    {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
                        <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
                                <span className="text-xs text-slate-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-6 border-t bg-white dark:bg-slate-900 shrink-0">
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
                                ref={textareaRef}
                                value={input}
                                autoComplete="on"
                                autoCorrect="on"
                                spellCheck={true}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={imageUrl || localImagePreview ? "Add a description about the issue..." : "Type your message..."}
                                className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none py-2.5 overflow-y-auto"
                                disabled={isLoading}
                                autoFocus
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {/* Send Button */}
                            {(input.trim() || imageUrl) && (
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || uploading}
                                    className={cn(
                                        "transition-all rounded-full h-10 w-10 shadow-lg shadow-indigo-500/20",
                                        "bg-indigo-600 hover:bg-indigo-700 text-white order-2"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </Button>
                            )}

                            {/* Voice Input */}
                            {isSupported && (
                                <div className={cn("flex items-center gap-1", (input.trim() || imageUrl) ? "order-1 mr-1" : "")}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-[10px] font-medium text-slate-500 hover:text-indigo-600"
                                        onClick={() => setLang(l => l === 'en-US' ? 'ml-IN' : 'en-US')}
                                        title="Switch Language"
                                    >
                                        {lang === 'en-US' ? 'EN' : 'ML'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={isListening ? "destructive" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "rounded-full h-10 w-10",
                                            isListening ? "animate-pulse shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-red-500 hover:bg-red-50"
                                        )}
                                        onClick={() => isListening ? stopListening() : startListening(lang)}
                                        title={isListening ? "Stop Recording" : "Start Voice Input"}
                                    >
                                        {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                    {/* AI generated disclaimer - ഗൂഗിൾ പ്ലേ സ്റ്റോർ പോളിസി അനുസരിച്ച് AI നിർദ്ദേശങ്ങൾക്കുള്ള ഡിസ്ക്ലൈമർ */}
                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
                        Disclaimer: ADH AI Coach generated response. Double check critical information.
                    </p>
                </div>
            </div>
        </div >
    )
}
