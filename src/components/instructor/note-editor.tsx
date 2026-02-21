'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Globe, Eye, Copy, Check, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { updateMasterNote, deleteMasterNote, MasterNote } from "@/actions/master-notes";
import { toast } from "react-hot-toast";

export interface NoteSection {
    id: string;
    title: string;
    content: string;
    link?: string;
}

interface NoteEditorProps {
    note: MasterNote;
}

export default function NoteEditor({ note }: NoteEditorProps) {
    const router = useRouter();
    const [title, setTitle] = useState(note.title);

    // Parse the existing content safely
    const [sections, setSections] = useState<NoteSection[]>(() => {
        try {
            // Check if it's new JSON format
            const parsed = JSON.parse(note.content);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            // Fallback for old simple string data
        }
        return [{
            id: crypto.randomUUID(),
            title: "Step 1",
            content: note.content || "",
            link: ""
        }];
    });

    const [isPublished, setIsPublished] = useState(note.is_published);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/notes/${note.id}`;

    const handlePublish = async () => {
        const newPublishedState = !isPublished;
        setIsPublished(newPublishedState);
        setIsSaving(true);
        try {
            await updateMasterNote(note.id, {
                title,
                content: JSON.stringify(sections),
                is_published: newPublishedState
            });
            toast.success(newPublishedState ? "Note published" : "Note unpublished");
            router.refresh();
        } catch (error) {
            setIsPublished(!newPublishedState); // Revert on error
            toast.error("Failed to update status");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMasterNote(note.id, {
                title,
                content: JSON.stringify(sections),
                is_published: isPublished
            });
            toast.success("Note saved successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await deleteMasterNote(note.id);
            toast.success("Note deleted");
            router.push("/instructor/notes");
        } catch (error) {
            toast.error("Failed to delete note");
        }
    };

    // Section Management
    const addSection = () => {
        setSections([...sections, {
            id: crypto.randomUUID(),
            title: `Step ${sections.length + 1}`,
            content: "",
            link: ""
        }]);
    };

    const updateSection = (id: string, updates: Partial<NoteSection>) => {
        setSections(sections.map(sec => sec.id === id ? { ...sec, ...updates } : sec));
    };

    const removeSection = (id: string) => {
        if (sections.length === 1) {
            toast.error("You must have at least one section");
            return;
        }
        setSections(sections.filter(sec => sec.id !== id));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/instructor/notes">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-bold bg-transparent border-none text-white focus-visible:ring-0 px-0 h-auto placeholder:text-slate-600"
                                placeholder="Untitled Note"
                            />
                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                <span className={isPublished ? "text-emerald-400" : "text-amber-400"}>
                                    {isPublished ? "Published" : "Draft"}
                                </span>
                                <span>•</span>
                                <span>Last saved: {new Date(note.updated_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                        >
                            Delete
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={isSaving}
                            variant="outline"
                            className={`border-slate-700 bg-slate-900 ${isPublished ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        >
                            {isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-cyan-700"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Main Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Editor Column */}
                    <div className="lg:col-span-2 space-y-6">

                        <div className="space-y-4">
                            {sections.map((section, index) => (
                                <div key={section.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                value={section.title}
                                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                className="text-lg font-bold border-none px-0 focus-visible:ring-0 shadow-none placeholder:text-slate-300 h-auto py-1"
                                                placeholder={`Step ${index + 1} Title`}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSection(section.id)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <Textarea
                                        value={section.content}
                                        onChange={(e) => {
                                            updateSection(section.id, { content: e.target.value });
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="min-h-[100px] bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 text-base leading-relaxed resize-none overflow-hidden"
                                        placeholder="Type content or prompt for this step..."
                                        ref={(el) => {
                                            if (el) {
                                                // Initial auto-resize
                                                el.style.height = 'auto';
                                                el.style.height = `${el.scrollHeight}px`;
                                            }
                                        }}
                                    />

                                    <div className="flex items-center gap-2 text-sm text-slate-500 border-t border-slate-100 pt-3">
                                        <LinkIcon className="h-4 w-4 shrink-0 text-slate-400" />
                                        <Input
                                            value={section.link || ""}
                                            onChange={(e) => updateSection(section.id, { link: e.target.value })}
                                            className="h-9 bg-transparent border-slate-200 shadow-none text-sm placeholder:text-slate-300"
                                            placeholder="Optional Action URL (e.g. https://chatgpt.com/g/g-...)"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-2 border-slate-700 hover:border-slate-500 bg-transparent text-slate-400 hover:text-slate-300 py-8"
                            onClick={addSection}
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Step
                        </Button>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
                            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-400" />
                                Publishing
                            </h3>

                            <div className="space-y-4">
                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                    <p className="text-sm font-medium text-slate-400 mb-2">Public Link</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-slate-900 p-2 rounded text-slate-300 truncate font-mono">
                                            {publicUrl}
                                        </code>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopyLink}>
                                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                                        </Button>
                                    </div>
                                </div>

                                {isPublished && (
                                    <Link href={`/notes/${note.id}`} target="_blank">
                                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View as Student
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="font-semibold text-slate-200 mb-2">How it works</h3>
                            <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                                <li>Add steps/sections using the + button.</li>
                                <li>Each section can have text and an optional action link.</li>
                                <li>Students edits are saved locally to their device per section.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
