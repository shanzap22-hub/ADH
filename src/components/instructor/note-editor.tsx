'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Globe, Eye, Copy, Check } from "lucide-react";
import Link from "next/link";
import { updateMasterNote, deleteMasterNote, MasterNote } from "@/actions/master-notes";
import { toast } from "react-hot-toast";

interface NoteEditorProps {
    note: MasterNote;
}

export default function NoteEditor({ note }: NoteEditorProps) {
    const router = useRouter();
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
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
                content,
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
                content,
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
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[500px] backdrop-blur-sm">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[500px] bg-slate-800 border-slate-700 resize-none text-white placeholder:text-slate-400 focus-visible:ring-0 text-lg leading-relaxed"
                                placeholder="Type your master note content here... Students will see this as their starting template."
                            />
                        </div>
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
                                <li>Create a template for your students.</li>
                                <li>Use placeholders like <code>[Your Name]</code> to guide them.</li>
                                <li>Share the public link.</li>
                                <li>Students edits are saved locally to their device.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
