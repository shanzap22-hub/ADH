'use client';

import { useState, useEffect } from "react";
import { MasterNote } from "@/actions/master-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RotateCcw, AlertCircle, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { Logo } from "@/components/logo"; // Adjust import if needed, assuming generic Logo component exists or I'll just use text

export default function StudentNoteView({ note }: { note: MasterNote }) {
    const [content, setContent] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasLocalEdits, setHasLocalEdits] = useState(false);

    const storageKey = `adh_note_${note.id}`;

    useEffect(() => {
        // Load from local storage or use master content
        const savedContent = localStorage.getItem(storageKey);
        if (savedContent) {
            setContent(savedContent);
            setHasLocalEdits(true);
            if (savedContent !== note.content) {
                // Could show a "Master updated" badge if needed, but for now simple
            }
        } else {
            setContent(note.content);
        }
        setIsLoaded(true);
    }, [note.id, note.content, storageKey]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);
        localStorage.setItem(storageKey, newContent);
        setHasLocalEdits(true);
    };

    const handleReset = () => {
        if (confirm("Are you sure? This will discard all your personal edits and revert to the instructor's template.")) {
            localStorage.removeItem(storageKey);
            setContent(note.content);
            setHasLocalEdits(false);
            toast.success("Reverted to original template");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        toast.success("Content copied to clipboard");
    };

    if (!isLoaded) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Placeholder for Logo if not available, replacing with text */}
                        <div className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            ADH Notebook
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasLocalEdits && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Revert to Instructor's Original"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleCopy}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Text
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-slate-900">{note.title}</h1>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            {hasLocalEdits ? (
                                <span className="flex items-center text-emerald-400">
                                    <Save className="h-3 w-3 mr-1" />
                                    Saved locally
                                </span>
                            ) : (
                                <span>Original Template</span>
                            )}
                        </div>
                    </div>

                    <Textarea
                        value={content}
                        onChange={handleContentChange}
                        className="w-full min-h-[calc(100vh-250px)] bg-white border-none p-6 text-lg leading-relaxed resize-none focus-visible:ring-0 text-slate-900 placeholder:text-slate-400"
                        placeholder="Start typing..."
                        spellCheck={false}
                    />
                </div>

                <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm text-slate-400">
                    <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-400 mb-1">Private & Local</p>
                        <p>Your edits are stored <strong>only in this browser</strong>. The instructor cannot see your changes. If you refresh, your work remains. To save permanently, copy the text to your preferred document editor.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
