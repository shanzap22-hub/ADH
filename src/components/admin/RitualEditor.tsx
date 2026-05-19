"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateRitualAction } from "@/app/actions/journey";
import { Headphones, CheckCircle2, Upload, Loader2, Music, X } from "lucide-react";
import { getPresignedUrl } from "@/actions/r2";

interface RitualEditorProps {
    ritual: {
        id: string;
        ritual_name: string;
        audio_url?: string;
        is_active: boolean;
    };
}

export const RitualEditor = ({ ritual }: RitualEditorProps) => {
    const [name, setName] = useState(ritual.ritual_name);
    const [audioUrl, setAudioUrl] = useState(ritual.audio_url || "");
    const [isActive, setIsActive] = useState(ritual.is_active);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            return toast.error("Please upload an audio file (mp3, wav, etc.)");
        }

        setIsUploading(true);

        try {
            // 1. Get presigned URL
            const { signedUrl, publicUrl, error } = await getPresignedUrl(file.name, file.type, "rituals-audio");
            if (error || !signedUrl) {
                throw new Error(error || "Failed to generate upload URL");
            }

            // 2. Upload directly to Cloudflare R2 from browser
            const uploadResponse = await fetch(signedUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            setAudioUrl(publicUrl);
            toast.success("Audio uploaded to R2 successfully!");
        } catch (error: any) {
            toast.error("Upload failed: " + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateRitualAction(ritual.id, {
                ritual_name: name,
                audio_url: audioUrl,
                is_active: isActive
            });
            
            if (result.success) {
                toast.success(`Updated ritual: ${name}`);
                setOpen(false);
                window.location.reload();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update ritual");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-violet-500 hover:text-violet-600 hover:bg-violet-50 font-bold">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-slate-200/60 dark:border-slate-800/60 max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black italic">Edit Ritual</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ritual Name</label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-2xl h-12 border-slate-100 bg-slate-50 dark:bg-slate-900 font-bold"
                            placeholder="e.g. Listen to Audio"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Headphones className="h-3 w-3 text-violet-500" />
                            Audio Resource
                        </label>
                        
                        <div className="flex flex-col gap-3">
                            {/* Audio Preview or Upload Placeholder */}
                            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-3 w-full overflow-hidden">
                                {audioUrl ? (
                                    <div className="w-full space-y-3 overflow-hidden">
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm w-full">
                                            <div className="shrink-0 w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                                                <Music className="h-5 w-5 text-violet-600" />
                                            </div>
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-400 uppercase truncate">Current Audio URL</p>
                                                <p className="text-xs font-bold text-slate-600 truncate">{audioUrl}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="shrink-0 h-8 w-8 text-rose-500"
                                                onClick={() => setAudioUrl("")}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <audio controls src={audioUrl} className="w-full h-10" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-slate-600">No audio file selected</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Upload an MP3 for this ritual</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="audio/*"
                                    className="hidden"
                                />
                                <Button 
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 rounded-2xl h-12 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {isUploading ? "Uploading to R2..." : "Upload MP3"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-2xl h-12 border-slate-200 text-slate-400 hover:text-violet-600"
                                    onClick={() => {
                                        const url = prompt("Or enter direct URL:");
                                        if (url) setAudioUrl(url);
                                    }}
                                >
                                    URL
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className={isActive ? "text-emerald-500" : "text-slate-300"}>
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">Status: {isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl font-bold text-violet-600 hover:bg-violet-100"
                            onClick={() => setIsActive(!isActive)}
                        >
                            Toggle
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoading || isUploading}
                        className="w-full h-14 rounded-[1.5rem] bg-violet-600 hover:bg-violet-700 font-black shadow-xl shadow-violet-500/30 text-white"
                    >
                        {isLoading ? "Saving Changes..." : "Update Ritual"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
