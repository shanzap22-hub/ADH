'use client';

import { useState, useEffect, useRef } from "react";
import { MasterNote } from "@/actions/master-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RotateCcw, AlertCircle, Save, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";

export interface NoteSection {
    id: string;
    title: string;
    content: string;
    link?: string;
}

export default function StudentNoteView({ note }: { note: MasterNote }) {
    const [sections, setSections] = useState<NoteSection[]>([]);
    const [localContent, setLocalContent] = useState<Record<string, string>>({});
    const [hasLocalEdits, setHasLocalEdits] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const storageKey = `adh_note_v2_${note.id}`;

    useEffect(() => {
        // Parse original master content
        let parsedSections: NoteSection[] = [];
        try {
            parsedSections = JSON.parse(note.content);
            if (!Array.isArray(parsedSections)) throw new Error("Not an array");
        } catch (e) {
            // Fallback for old simple string data
            parsedSections = [{
                id: 'fallback_id',
                title: "Step 1",
                content: note.content,
                link: ""
            }];
        }

        setSections(parsedSections);

        // Load local edits
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsedLocal = JSON.parse(savedData);
                setLocalContent(parsedLocal);
                setHasLocalEdits(true);
            } catch (e) {
                console.error("Failed to parse local storage");
            }
        } else {
            // Initialize local content with original
            const initialLocal: Record<string, string> = {};
            parsedSections.forEach(sec => {
                initialLocal[sec.id] = sec.content;
            });
            setLocalContent(initialLocal);
        }

        setIsLoaded(true);
    }, [note.id, note.content, storageKey]);

    const handleContentChange = (sectionId: string, newContent: string) => {
        const updatedLocal = { ...localContent, [sectionId]: newContent };
        setLocalContent(updatedLocal);
        localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
        setHasLocalEdits(true);
    };

    const handleReset = () => {
        if (confirm("Are you sure? This will discard all your personal edits and revert to the instructor's template.")) {
            localStorage.removeItem(storageKey);

            const initialLocal: Record<string, string> = {};
            sections.forEach(sec => {
                initialLocal[sec.id] = sec.content;
            });
            setLocalContent(initialLocal);

            setHasLocalEdits(false);
            toast.success("Reverted to original template");
        }
    };

    const handleCopySection = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success("Section copied to clipboard");
    };

    const scrollToSection = (index: number) => {
        if (sectionRefs.current[index]) {
            const yOffset = -80; // offset for the sticky nav
            const element = sectionRefs.current[index];
            const y = element!.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (!isLoaded) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Nav Bar */}
            <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate hidden sm:block">
                            {note.title}
                        </div>

                        {/* Step Navigation Pill */}
                        <div className="flex bg-slate-900 rounded-full p-1 border border-slate-800">
                            {sections.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => scrollToSection(idx)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasLocalEdits && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hidden sm:flex"
                                title="Revert to Instructor's Original"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                        )}
                        {hasLocalEdits && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReset}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 sm:hidden"
                                title="Revert to Instructor's Original"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">

                <div className="space-y-12 pb-20 pt-4">
                    {sections.map((section, index) => (
                        <div
                            key={section.id}
                            ref={(el) => { sectionRefs.current[index] = el; }}
                            className="space-y-4 scroll-mt-24" // scroll margin for anchor links
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-slate-200 flex items-center gap-6">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30 text-lg shadow-inner">
                                        {index + 1}
                                    </span>
                                    {section.title}
                                </h2>
                            </div>

                            <div className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl shadow-black/5">
                                {/* Inline Copy Button */}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleCopySection(localContent[section.id] || "")}
                                    className="absolute top-3 right-3 z-10 bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm border border-slate-300 font-medium h-8 px-3 transition-colors"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>

                                <Textarea
                                    value={localContent[section.id] || ""}
                                    onChange={(e) => {
                                        handleContentChange(section.id, e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full min-h-[100px] bg-transparent border-none p-6 text-lg leading-relaxed resize-none overflow-hidden focus-visible:ring-0 text-slate-900 placeholder:text-slate-400 font-medium"
                                    placeholder="Start typing..."
                                    spellCheck={false}
                                    ref={(el) => {
                                        if (el) {
                                            // Initial auto-resize
                                            el.style.height = 'auto';
                                            el.style.height = `${el.scrollHeight}px`;
                                        }
                                    }}
                                />

                                {section.link && (
                                    <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex items-center justify-between">
                                        <div className="text-sm text-slate-500 font-medium truncate max-w-[50%] sm:max-w-none">
                                            {section.link.replace(/^https?:\/\//, '')}
                                        </div>
                                        <a href={section.link.startsWith('http') ? section.link : `https://${section.link}`} target="_blank" rel="noopener noreferrer">
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-6 font-semibold rounded-full transition-transform hover:scale-105">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open Link
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
