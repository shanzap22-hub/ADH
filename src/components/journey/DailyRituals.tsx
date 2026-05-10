"use client";

import { useState, useEffect, useRef } from "react";
import { 
    CheckCircle2, Trophy, Play, Pause, Volume2, 
    Edit3, Target, FileText, Headphones, Lock, Sparkles, ArrowRight, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { toggleRitualAction, saveAffirmationsAction, adminUpdateUserJourneyAction } from "@/app/actions/journey";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GoalCard } from "./GoalCard";

interface Ritual {
    id: string;
    ritual_name: string;
    audio_url?: string;
    is_completed: boolean;
}

interface DailyRitualsProps {
    initialRituals: Ritual[];
}

export const DailyRituals = ({ initialRituals }: DailyRitualsProps) => {
    const [rituals, setRituals] = useState(initialRituals);
    const [affirmations, setAffirmations] = useState("");
    const [isEditingAffirmations, setIsEditingAffirmations] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
    const [isUpdatingRevenue, setIsUpdatingRevenue] = useState(false);
    const [newRevenue, setNewRevenue] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchRitualData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("user_rituals_data")
                .select("affirmations")
                .eq("user_id", user.id)
                .single();
            
            if (data?.affirmations) setAffirmations(data.affirmations);
        };
        fetchRitualData();
        
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
    }, [supabase]);

    const toggleRitual = async (id: string) => {
        if (!id) return;
        const ritual = rituals.find(r => r.id === id);
        if (!ritual) return;
        const newStatus = !ritual.is_completed;
        
        setRituals(prev => prev.map(r => r.id === id ? { ...r, is_completed: newStatus } : r));

        try {
            const result = await toggleRitualAction(id, newStatus);
            if (!result.success) throw new Error(result.error);
            toast.success(newStatus ? "Goal reached!" : "Reset");
        } catch {
            setRituals(prev => prev.map(r => r.id === id ? { ...r, is_completed: !newStatus } : r));
            toast.error("Failed to update");
        }
    };

    const saveAffirmations = async () => {
        setIsLoading(true);
        try {
            const result = await saveAffirmationsAction(affirmations);
            if (result.success) {
                toast.success("Affirmations updated");
                setIsEditingAffirmations(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save affirmations");
        } finally {
            setIsLoading(false);
        }
    };

    const updateRevenue = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const result = await adminUpdateUserJourneyAction(user.id, "current", Number(newRevenue), 100000); // Temporary target
            if (result.success) {
                toast.success("Revenue updated!");
                setIsUpdatingRevenue(false);
                window.location.reload();
            } else throw new Error(result.error);
        } catch (error: any) {
            toast.error(error.message || "Failed to update revenue");
        } finally {
            setIsLoading(false);
        }
    };

    const speakAffirmations = async () => {
        if (!affirmations) return toast.error("Please write some affirmations first");

        // Malayalam ടെക്സ്റ്റ് ഡിറ്റക്ഷൻ
        const isMalayalam = /[\u0D00-\u0D7F]/.test(affirmations);

        if (isMalayalam) {
            if (audioRef.current && isAudioPlaying) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsAudioPlaying(false);
                return;
            }

            setIsGeneratingTTS(true);
            const toastId = toast.loading("ഓഡിയോ തയ്യാറാക്കുന്നു...");

            try {
                // ഗൂഗിൾ ട്രാൻസ്ലേറ്റിന് 200 അക്ഷരങ്ങളുടെ ലിമിറ്റ് ഉള്ളതിനാൽ നമ്മൾ ടെക്സ്റ്റ് മുറിക്കുന്നു
                const chunks = affirmations.match(/.{1,150}(?:\s|$)|.{1,150}/g) || [affirmations];
                const audioArrays: Uint8Array[] = [];

                // ഓരോ ഭാഗമായി API-ലേക്ക് അയച്ച് ഓഡിയോ എടുക്കുന്നു
                for (const chunk of chunks) {
                    if (!chunk.trim()) continue;
                    const response = await fetch(`https://lingva.ml/api/v1/audio/ml/${encodeURIComponent(chunk.trim())}`);
                    if (!response.ok) throw new Error("TTS API failed");
                    const data = await response.json();
                    if (data.audio && data.audio.length > 0) {
                        audioArrays.push(new Uint8Array(data.audio));
                    }
                }

                if (audioArrays.length === 0) throw new Error("No audio generated");

                // എല്ലാ ഓഡിയോ ഭാഗങ്ങളും ഒന്നിച്ച് ചേർക്കുന്നു (MP3 കൺകാറ്റിനേഷൻ)
                const totalLength = audioArrays.reduce((acc, arr) => acc + arr.length, 0);
                const combinedAudio = new Uint8Array(totalLength);
                let offset = 0;
                for (const arr of audioArrays) {
                    combinedAudio.set(arr, offset);
                    offset += arr.length;
                }

                // ബ്രൗസറിന് പ്ലേ ചെയ്യാൻ കഴിയുന്ന Blob URL ആക്കി മാറ്റുന്നു
                const blob = new Blob([combinedAudio], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(blob);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.onended = () => {
                        setIsAudioPlaying(false);
                        URL.revokeObjectURL(audioUrl); // മെമ്മറി ഫ്രീ ആക്കുന്നു
                    };
                    await audioRef.current.play();
                    setIsAudioPlaying(true);
                    toast.success("മലയാളം അഫിർമേഷൻസ് പ്ലേ ചെയ്യുന്നു...", { id: toastId });
                }
            } catch (error) {
                console.error("TTS Error:", error);
                toast.error("ഓഡിയോ പ്ലേ ചെയ്യാൻ കഴിഞ്ഞില്ല. ഇൻ്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.", { id: toastId });
            } finally {
                setIsGeneratingTTS(false);
            }
            return;
        }

        // ഇംഗ്ലീഷ് TTS: Browser speechSynthesis ഉപയോഗിക്കുന്നു
        const synth = window.speechSynthesis;
        if (synth.speaking) { synth.cancel(); return; }

        const voices = synth.getVoices();
        const utterance = new SpeechSynthesisUtterance(affirmations);
        const enVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Premium")));
        if (enVoice) { utterance.voice = enVoice; }
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.onstart = () => setIsAudioPlaying(true);
        utterance.onend = () => setIsAudioPlaying(false);
        toast.info("Playing affirmations...");
        synth.speak(utterance);
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isAudioPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsAudioPlaying(!isAudioPlaying);
        }
    };

    const completedCount = rituals.filter(r => r.is_completed).length;
    const progress = rituals.length > 0 ? (completedCount / rituals.length) * 100 : 0;
    
    // Find specific rituals
    const listenRitual = rituals.find(r => r.ritual_name.toLowerCase().includes("listen"));
    const goalCardRitual = rituals.find(r => r.ritual_name.toLowerCase().includes("goal card"));
    const twentyGoalsRitual = rituals.find(r => r.ritual_name.toLowerCase().includes("20 goals"));
    const affirmationRitual = rituals.find(r => r.ritual_name.toLowerCase().includes("affirmation"));

    // Audio source fallback
    const audioSource = listenRitual?.audio_url || "https://archive.org/download/TheStrangestSecret_201602/The%20Strangest%20Secret.mp3";

    return (
        <Card className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black">Daily Rituals</CardTitle>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest italic">The core of your success</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isUpdatingRevenue} onOpenChange={setIsUpdatingRevenue}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Update Revenue
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2.5rem] max-w-sm">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black">Update Current Revenue</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Enter Amount (₹)</p>
                                        <input 
                                            type="number" 
                                            value={newRevenue}
                                            onChange={(e) => setNewRevenue(e.target.value)}
                                            placeholder="e.g. 50000"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                        />
                                    </div>
                                    <Button onClick={updateRevenue} disabled={isLoading} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black">
                                        {isLoading ? "Updating..." : "Confirm Update"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Trophy className={cn(
                            "h-10 w-10 transition-all duration-700",
                            progress === 100 ? "text-amber-500 scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-slate-200 dark:text-slate-800"
                        )} />
                    </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8 p-8">
                
                {/* Goal Card Section */}
                {goalCardRitual && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">My Destination</h4>
                            </div>
                            <button 
                                onClick={() => toggleRitual(goalCardRitual.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-500 shadow-lg",
                                    goalCardRitual.is_completed 
                                        ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-tight">Mark as Visualized</span>
                                <CheckCircle2 className="h-4 w-4" />
                            </button>
                        </div>
                        <GoalCard />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Listen to Audio Section */}
                    {listenRitual && (
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-6 group shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner">
                                    <Headphones className="h-7 w-7" />
                                </div>
                                <button 
                                    onClick={() => toggleRitual(listenRitual.id)}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        listenRitual.is_completed 
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-wide">{listenRitual.ritual_name}</h4>
                                    <p className="text-xs text-slate-500 truncate">Audio Guide • Essential Learning</p>
                                </div>
                                <Button 
                                    onClick={toggleAudio}
                                    className={cn(
                                        "w-full h-12 rounded-2xl transition-all duration-500 font-black gap-2 shadow-lg shadow-rose-500/10",
                                        isAudioPlaying ? "bg-rose-500 hover:bg-rose-600" : "bg-slate-900 hover:bg-slate-800 text-white"
                                    )}
                                >
                                    {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {isAudioPlaying ? "Playing..." : "Play Now"}
                                </Button>
                                <audio 
                                    ref={audioRef} 
                                    src={audioSource} 
                                    onEnded={() => setIsAudioPlaying(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* 20 Goals Section */}
                    {twentyGoalsRitual && (
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-6 group shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <button 
                                    onClick={() => toggleRitual(twentyGoalsRitual.id)}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        twentyGoalsRitual.is_completed 
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-wide">{twentyGoalsRitual.ritual_name}</h4>
                                    <p className="text-xs text-slate-500">Handwritten offline</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                                    <p className="text-[11px] font-bold text-slate-400 italic">"Keep your vision clear and written"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Affirmations Section */}
                {affirmationRitual && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 group gap-4 shadow-xl">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform shadow-inner">
                                    <Volume2 className="h-8 w-8 text-violet-600" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black uppercase tracking-wide">Daily Affirmations</h4>
                                        <Dialog open={isEditingAffirmations} onOpenChange={setIsEditingAffirmations}>
                                            <DialogTrigger asChild>
                                                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                    <Edit3 className="h-4 w-4 text-slate-400 hover:text-violet-500" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] max-w-2xl w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden">
                                                <DialogHeader className="p-8 pb-0">
                                                    <DialogTitle className="text-2xl font-black">Edit Your Affirmations</DialogTitle>
                                                    <p className="text-sm text-slate-500">Write your powerful declarations for the day</p>
                                                </DialogHeader>
                                                <div className="flex-1 p-8">
                                                    <Textarea 
                                                        value={affirmations}
                                                        onChange={(e) => setAffirmations(e.target.value)}
                                                        placeholder="I am worthy, I am successful..."
                                                        className="w-full h-full rounded-[2rem] border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus-visible:ring-violet-500 p-8 text-lg font-medium leading-relaxed resize-none"
                                                    />
                                                </div>
                                                <div className="p-8 pt-0 flex justify-end gap-3">
                                                    <Button variant="ghost" onClick={() => setIsEditingAffirmations(false)} className="rounded-2xl px-8">Cancel</Button>
                                                    <Button onClick={saveAffirmations} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl px-12 font-black shadow-xl shadow-violet-500/20">
                                                        {isLoading ? "Saving..." : "Save Affirmations"}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="relative">
                                        <div className={cn(
                                            "max-h-16 overflow-hidden pr-2 transition-all duration-500",
                                            affirmations.length > 80 && "mask-fade-bottom"
                                        )}>
                                            <p className="text-xs text-slate-500 italic leading-relaxed break-words">
                                                {affirmations || "Type your positive affirmations..."}
                                            </p>
                                        </div>
                                        {affirmations.length > 80 && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="text-[10px] font-black text-violet-600 hover:text-violet-700 mt-1 uppercase tracking-widest flex items-center gap-1">
                                                        Read Full <ArrowRight className="h-2 w-2" />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-8 shadow-3xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black italic">Daily Affirmations</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="mt-4 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 italic text-xl leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap shadow-inner">
                                                        "{affirmations}"
                                                    </div>
                                                    <div className="sticky bottom-0 pt-6 bg-inherit">
                                                        <Button onClick={speakAffirmations} className="w-full rounded-2xl h-14 bg-violet-600 hover:bg-violet-700 text-white font-black gap-3 shadow-xl shadow-violet-500/20">
                                                            <Headphones className="h-5 w-5" />
                                                            Listen to Voice
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={speakAffirmations} 
                                    disabled={isGeneratingTTS}
                                    className="rounded-2xl h-14 w-14 border-violet-100 dark:border-violet-900 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 shadow-sm"
                                >
                                    {isGeneratingTTS 
                                        ? <span className="h-5 w-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                        : isAudioPlaying 
                                            ? <Pause className="h-6 w-6" /> 
                                            : <Headphones className="h-6 w-6" />
                                    }
                                </Button>
                                <button 
                                    onClick={() => toggleRitual(affirmationRitual.id)}
                                    className={cn(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        affirmationRitual.is_completed 
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-7 w-7" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
