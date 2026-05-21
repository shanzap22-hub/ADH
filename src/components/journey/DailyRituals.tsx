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
import { Input } from "@/components/ui/input";
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
    
    // Sync when initialRituals changes (e.g. Next.js re-fetching page data)
    useEffect(() => {
        setRituals(initialRituals);
    }, [initialRituals]);

    const [affirmations, setAffirmations] = useState("");
    const [isEditingAffirmations, setIsEditingAffirmations] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAffirmationsPlaying, setIsAffirmationsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
    const [isUpdatingRevenue, setIsUpdatingRevenue] = useState(false);
    const [newRevenue, setNewRevenue] = useState("");
    const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isWritingGoalsOnline, setIsWritingGoalsOnline] = useState(false);
    const [isHistoryMode, setIsHistoryMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [goalsHistory, setGoalsHistory] = useState<Record<string, Record<string, string[]>>>({});
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const affirmationsAudioRef = useRef<HTMLAudioElement | null>(null);
    const supabase = createClient();

    const goalCategories = [
        {
            name: "Business & Career",
            desc: "What changes do you want to bring in your business? (e.g., launching a new product/course)",
            placeholder: "e.g. I have successfully launched my new online course..."
        },
        {
            name: "Purchases & Wealth",
            desc: "What do you intend to buy? (Write as if you already own it)",
            placeholder: "e.g. I am so happy and grateful that I bought my dream car..."
        },
        {
            name: "Relationships",
            desc: "How do you want to improve relationships with family and others?",
            placeholder: "e.g. I have a very loving and peaceful relationship with my family..."
        },
        {
            name: "Personal Life",
            desc: "Habits to build or avoid (e.g., stop eating junk food)",
            placeholder: "e.g. I eat only healthy food and take care of my body..."
        }
    ];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const history = localStorage.getItem('daily_goals_history');
            if (history) {
                try {
                    setGoalsHistory(JSON.parse(history));
                } catch (e) {
                    console.error("Failed to parse goals history");
                }
            }
        }
    }, []);

    useEffect(() => {
        if (affirmationsAudioRef.current) {
            affirmationsAudioRef.current.src = "";
            setIsAffirmationsPlaying(false);
            setFetchedAudioUrl(null);
        }
    }, [affirmations]);

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

        const isMalayalam = /[\u0D00-\u0D7F]/.test(affirmations);
        const targetLang = isMalayalam ? "ml-IN" : "en-US";

        // Pause if already playing
        if (isAffirmationsPlaying && affirmationsAudioRef.current) {
            affirmationsAudioRef.current.pause();
            setIsAffirmationsPlaying(false);
            return;
        }

        // Resume if paused and loaded
        if (!isAffirmationsPlaying && affirmationsAudioRef.current && affirmationsAudioRef.current.src && affirmationsAudioRef.current.currentTime > 0 && !affirmationsAudioRef.current.ended) {
            try {
                await affirmationsAudioRef.current.play();
                setIsAffirmationsPlaying(true);
            } catch { /* ignore */ }
            return;
        }

        // Play from cache if already fetched
        if (fetchedAudioUrl && affirmationsAudioRef.current) {
            try {
                affirmationsAudioRef.current.currentTime = 0;
                await affirmationsAudioRef.current.play();
                setIsAffirmationsPlaying(true);
            } catch { /* ignore */ }
            return;
        }

        // ===== CRITICAL: Unlock audio on user gesture =====
        // Android WebView blocks audio.play() unless it happens during a user gesture.
        // We play a tiny silent sound IMMEDIATELY (within the click handler)
        // to "unlock" the audio context, then swap src to real TTS audio.
        const audio = affirmationsAudioRef.current;
        if (audio) {
            // Create a minimal silent MP3 (tiny base64 encoded silent audio)
            const silentMp3 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
            try {
                audio.src = silentMp3;
                audio.volume = 0.01;
                await audio.play();
                audio.pause();
                audio.volume = 1.0;
            } catch (e) {
                console.warn("[TTS] Silent audio unlock failed:", e);
            }
        }

        setIsGeneratingTTS(true);
        const toastId = toast.loading("ഓഡിയോ തയ്യാറാക്കുന്നു...");

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: affirmations, lang: targetLang })
            });

            if (!response.ok) throw new Error("TTS generation failed");

            const data = await response.json();
            const audioUrl = data.audioUrl || (data.audioBase64 ? `data:audio/mpeg;base64,${data.audioBase64}` : null);

            if (!audioUrl) throw new Error("No audio received");

            setFetchedAudioUrl(audioUrl);

            if (audio) {
                audio.onended = () => setIsAffirmationsPlaying(false);
                audio.onerror = (e) => {
                    console.error("[TTS] Audio element error:", e);
                    setIsAffirmationsPlaying(false);
                    toast.error("ഓഡിയോ പ്ലേ ചെയ്യാൻ കഴിഞ്ഞില്ല.", { id: toastId });
                };
                
                // Set source and wait for it to be ready
                audio.src = audioUrl;
                audio.load();
                
                await new Promise<void>((resolve, reject) => {
                    const onReady = () => {
                        audio.removeEventListener('canplaythrough', onReady);
                        resolve();
                    };
                    audio.addEventListener('canplaythrough', onReady);
                    audio.addEventListener('error', () => reject(new Error("Audio load failed")), { once: true });
                    setTimeout(() => reject(new Error("Audio load timeout")), 15000);
                });
                
                await audio.play();
                setIsAffirmationsPlaying(true);
                toast.success("അഫിർമേഷൻസ് പ്ലേ ചെയ്യുന്നു...", { id: toastId });
            }
        } catch (error) {
            console.error("[TTS] Error:", error);
            toast.error("ഓഡിയോ പ്ലേ ചെയ്യാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.", { id: toastId });
        } finally {
            setIsGeneratingTTS(false);
        }
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isAudioPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsAudioPlaying(!isAudioPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            localStorage.setItem('strangest_secret_progress', audioRef.current.currentTime.toString());
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
            const savedProgress = localStorage.getItem('strangest_secret_progress');
            if (savedProgress) {
                audioRef.current.currentTime = parseFloat(savedProgress);
                setAudioProgress(parseFloat(savedProgress));
            }
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setAudioProgress(time);
        }
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
                                    <DialogTitle className="text-xl font-black text-slate-800">Update Current Revenue</DialogTitle>
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
                                    <Button onClick={updateRevenue} disabled={isLoading} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none text-white font-black shadow-md shadow-emerald-500/20">
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
                
                {/* Goal Card Section — My Destination */}
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
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 p-6 sm:p-8 group shadow-xl">
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
                                    <h4 className="text-sm font-black uppercase tracking-wide text-rose-900 dark:text-rose-400">{listenRitual.ritual_name}</h4>
                                    <p className="text-xs text-rose-700/60 dark:text-rose-400/60 truncate">Audio Guide • Essential Learning</p>
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
                                
                                <div className="space-y-1">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={audioDuration || 100} 
                                        value={audioProgress}
                                        onChange={handleSeek}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>{formatTime(audioProgress)}</span>
                                        <span>{formatTime(audioDuration)}</span>
                                    </div>
                                </div>

                                <audio 
                                    ref={audioRef} 
                                    src={audioSource} 
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={() => setIsAudioPlaying(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* 20 Goals Section */}
                    {twentyGoalsRitual && (
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10 p-6 sm:p-8 group shadow-xl">
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
                                    <h4 className="text-sm font-black uppercase tracking-wide text-indigo-900 dark:text-indigo-400">{twentyGoalsRitual.ritual_name}</h4>
                                    <p className="text-xs text-indigo-700/60 dark:text-indigo-400/60">Handwritten offline or Online</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500 italic">"Please use the online goal book ONLY when it is not possible to write in your offline physical goal book."</p>
                                    </div>
                                     <Dialog open={isWritingGoalsOnline} onOpenChange={(open) => {
                                        setIsWritingGoalsOnline(open);
                                        if (open) {
                                            setIsHistoryMode(false);
                                            setSelectedDate(new Date().toISOString().split('T')[0]);
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full rounded-2xl border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                Write Online Instead
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[2.5rem] max-w-2xl w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden">
                                            <DialogHeader className="p-6 md:p-8 pb-0">
                                                <DialogTitle className="text-2xl font-black flex items-center justify-between">
                                                    <span>{isHistoryMode ? "Goal History" : "Write Your 20 Goals"}</span>
                                                </DialogTitle>
                                                
                                                {isHistoryMode ? (
                                                    <div className="flex items-center justify-between mt-6 mb-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className="rounded-xl"
                                                            onClick={() => {
                                                                const d = new Date(selectedDate);
                                                                d.setDate(d.getDate() - 1);
                                                                setSelectedDate(d.toISOString().split('T')[0]);
                                                            }}
                                                        >
                                                            &larr; Prev
                                                        </Button>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className="rounded-xl"
                                                            onClick={() => {
                                                                const d = new Date(selectedDate);
                                                                d.setDate(d.getDate() + 1);
                                                                setSelectedDate(d.toISOString().split('T')[0]);
                                                            }}
                                                            disabled={selectedDate === new Date().toISOString().split('T')[0]}
                                                        >
                                                            Next &rarr;
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center mt-6 mb-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}

                                            </DialogHeader>
                                            <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
                                                {/* Category Tabs */}
                                                <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
                                                    {goalCategories.map((cat, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveCategoryIdx(idx)}
                                                            className={cn(
                                                                "whitespace-nowrap px-4 py-2 rounded-2xl font-bold text-sm transition-all",
                                                                activeCategoryIdx === idx 
                                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                                                                    : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
                                                            )}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                
                                                {/* Goals List */}
                                                <div className="space-y-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <div className="mb-4 space-y-1">
                                                        <h3 className="font-black text-lg text-slate-800 dark:text-slate-200">
                                                            {goalCategories[activeCategoryIdx].name} Goals
                                                        </h3>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {goalCategories[activeCategoryIdx].desc}
                                                        </p>
                                                    </div>
                                                    {[0, 1, 2, 3, 4].map((goalIdx) => {
                                                        const catName = goalCategories[activeCategoryIdx].name;
                                                        const val = (goalsHistory[selectedDate]?.[catName] && Array.isArray(goalsHistory[selectedDate][catName])) 
                                                            ? goalsHistory[selectedDate][catName][goalIdx] 
                                                            : "";
                                                        
                                                        return (
                                                            <div key={goalIdx} className="flex gap-3 items-center">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                                    {goalIdx + 1}
                                                                </div>
                                                                <Input 
                                                                    value={val}
                                                                    disabled={isHistoryMode}
                                                                    placeholder={goalIdx === 0 ? goalCategories[activeCategoryIdx].placeholder : `Write goal #${goalIdx + 1}...`}
                                                                    className={cn(
                                                                        "h-12 rounded-2xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500",
                                                                        isHistoryMode ? "bg-transparent opacity-80 cursor-default" : "bg-slate-50 dark:bg-slate-950"
                                                                    )}
                                                                    onChange={(e) => {
                                                                        setGoalsHistory(prev => {
                                                                            const newHistory = { ...prev };
                                                                            if (!newHistory[selectedDate]) newHistory[selectedDate] = {};
                                                                            
                                                                            let catArray = newHistory[selectedDate][catName];
                                                                            if (!Array.isArray(catArray)) {
                                                                                catArray = ["", "", "", "", ""];
                                                                            } else {
                                                                                catArray = [...catArray];
                                                                            }
                                                                            
                                                                            catArray[goalIdx] = e.target.value;
                                                                            newHistory[selectedDate][catName] = catArray;
                                                                            localStorage.setItem('daily_goals_history', JSON.stringify(newHistory));
                                                                            return newHistory;
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="p-4 md:p-8 pt-0 flex flex-col sm:flex-row justify-end gap-3 mt-auto border-t border-slate-100 dark:border-slate-800/60 sm:pt-4">
                                                {isHistoryMode ? (
                                                    <>
                                                        <Button variant="ghost" onClick={() => setIsWritingGoalsOnline(false)} className="rounded-2xl w-full sm:w-auto px-8">Close</Button>
                                                        <Button onClick={() => {
                                                            setIsHistoryMode(false);
                                                            setSelectedDate(new Date().toISOString().split('T')[0]);
                                                        }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl w-full sm:w-auto px-8 font-black shadow-md shadow-indigo-500/20">
                                                            <Edit3 className="h-4 w-4 mr-2" /> Write Today's Goals
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 w-full sm:w-auto mb-2 sm:mb-0">
                                                            <Button variant="outline" onClick={() => {
                                                                setIsHistoryMode(true);
                                                                const d = new Date(selectedDate);
                                                                d.setDate(d.getDate() - 1);
                                                                setSelectedDate(d.toISOString().split('T')[0]);
                                                            }} className="w-full sm:w-auto rounded-2xl px-4 text-slate-500 border-slate-200 dark:border-slate-800">
                                                                View History
                                                            </Button>
                                                        </div>
                                                        <Button variant="ghost" onClick={() => setIsWritingGoalsOnline(false)} className="rounded-2xl w-full sm:w-auto px-4 md:px-8">Close</Button>
                                                        <Button onClick={() => {
                                                            toast.success(`Goals saved for ${new Date(selectedDate).toLocaleDateString()}!`);
                                                            setIsWritingGoalsOnline(false);
                                                        }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl w-full sm:w-auto px-6 md:px-12 font-black shadow-md shadow-indigo-500/20">
                                                            Save Goals
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Affirmations Section */}
                {affirmationRitual && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-[2.5rem] border border-violet-100 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-950/10 group gap-4 shadow-xl">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform shadow-inner">
                                    <Volume2 className="h-8 w-8 text-violet-600" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black uppercase tracking-wide text-violet-900 dark:text-violet-400">Daily Affirmations</h4>
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
                                                <div className="p-4 sm:p-8 pt-0 flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-0">
                                                    <Button variant="ghost" onClick={() => setIsEditingAffirmations(false)} className="rounded-2xl w-full sm:w-auto px-8">Cancel</Button>
                                                    <Button onClick={saveAffirmations} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 border-none text-white rounded-2xl w-full sm:w-auto px-12 font-black shadow-md shadow-violet-500/20">
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
                                                        <Button onClick={speakAffirmations} className="w-full rounded-2xl h-14 bg-violet-600 hover:bg-violet-700 border-none text-white font-black gap-3 shadow-md shadow-violet-500/20">
                                                            {isGeneratingTTS ? (
                                                                <><span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing Audio...</>
                                                            ) : isAffirmationsPlaying ? (
                                                                <><Pause className="h-5 w-5" /> Pause Audio</>
                                                            ) : (
                                                                <><Headphones className="h-5 w-5" /> Listen to Voice</>
                                                            )}
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
                                        : isAffirmationsPlaying 
                                            ? <Pause className="h-6 w-6" /> 
                                            : <Headphones className="h-6 w-6" />
                                    }
                                </Button>
                                <audio ref={affirmationsAudioRef} className="hidden" />
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
