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
    const [affirmations, setAffirmations] = useState("");
    const [isEditingAffirmations, setIsEditingAffirmations] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAffirmationsPlaying, setIsAffirmationsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
    const [isUpdatingRevenue, setIsUpdatingRevenue] = useState(false);
    const [newRevenue, setNewRevenue] = useState("");
    const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(null);
    const [isWritingGoalsOnline, setIsWritingGoalsOnline] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [goalsHistory, setGoalsHistory] = useState<Record<string, Record<string, string[]>>>({});
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const affirmationsAudioRef = useRef<HTMLAudioElement | null>(null);
    const supabase = createClient();

    const goalCategories = [
        "Category 1 (Health & Fitness)",
        "Category 2 (Wealth & Career)",
        "Category 3 (Relationships & Family)",
        "Category 4 (Personal & Spiritual)"
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

        if (isMalayalam) {
            // Pause if already playing
            if (isAffirmationsPlaying && affirmationsAudioRef.current) {
                affirmationsAudioRef.current.pause();
                setIsAffirmationsPlaying(false);
                return;
            }

            // Resume if paused and loaded
            if (!isAffirmationsPlaying && affirmationsAudioRef.current && affirmationsAudioRef.current.src && affirmationsAudioRef.current.currentTime > 0 && !affirmationsAudioRef.current.ended) {
                await affirmationsAudioRef.current.play();
                setIsAffirmationsPlaying(true);
                return;
            }

            // Play from cache if already fetched
            if (fetchedAudioUrl && affirmationsAudioRef.current) {
                affirmationsAudioRef.current.currentTime = 0;
                await affirmationsAudioRef.current.play();
                setIsAffirmationsPlaying(true);
                return;
            }

            setIsGeneratingTTS(true);
            const toastId = toast.loading("ഓഡിയോ തയ്യാറാക്കുന്നു...");

            try {
                const response = await fetch("/api/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: affirmations, lang: "ml-IN" })
                });

                if (!response.ok) throw new Error("TTS generation failed");

                const data = await response.json();
                const audioUrl = data.audioUrl || (data.audioBase64 ? `data:audio/mpeg;base64,${data.audioBase64}` : null);

                if (!audioUrl) throw new Error("No audio received");

                setFetchedAudioUrl(audioUrl);

                if (affirmationsAudioRef.current) {
                    affirmationsAudioRef.current.src = audioUrl;
                    affirmationsAudioRef.current.onended = () => setIsAffirmationsPlaying(false);
                    await affirmationsAudioRef.current.play();
                    setIsAffirmationsPlaying(true);
                    toast.success("മലയാളം അഫിർമേഷൻസ് പ്ലേ ചെയ്യുന്നു...", { id: toastId });
                }
            } catch (error) {
                console.error("TTS Error:", error);
                
                try {
                    const synth = window.speechSynthesis;
                    if (synth) {
                        const utterance = new SpeechSynthesisUtterance(affirmations);
                        utterance.lang = 'ml-IN';
                        utterance.rate = 0.85;
                        utterance.onend = () => setIsAffirmationsPlaying(false);
                        synth.speak(utterance);
                        setIsAffirmationsPlaying(true);
                        toast.success("മലയാളം അഫിർമേഷൻസ് പ്ലേ ചെയ്യുന്നു...", { id: toastId });
                    } else {
                        toast.error("ഓഡിയോ പ്ലേ ചെയ്യാൻ കഴിഞ്ഞില്ല.", { id: toastId });
                    }
                } catch {
                    toast.error("ഓഡിയോ പ്ലേ ചെയ്യാൻ കഴിഞ്ഞില്ല.", { id: toastId });
                }
            } finally {
                setIsGeneratingTTS(false);
            }
            return;
        }

        // ഇംഗ്ലീഷ് TTS: Browser speechSynthesis ഉപയോഗിക്കുന്നു
        const synth = window.speechSynthesis;
        if (synth.speaking) { 
            synth.cancel(); 
            setIsAffirmationsPlaying(false);
            return; 
        }

        const voices = synth.getVoices();
        const utterance = new SpeechSynthesisUtterance(affirmations);
        const enVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Premium")));
        if (enVoice) { utterance.voice = enVoice; }
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.onstart = () => setIsAffirmationsPlaying(true);
        utterance.onend = () => setIsAffirmationsPlaying(false);
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
                                    <p className="text-xs text-slate-500">Handwritten offline or Online</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[11px] font-bold text-slate-400 italic">"Keep your vision clear and written"</p>
                                    </div>
                                    <Dialog open={isWritingGoalsOnline} onOpenChange={setIsWritingGoalsOnline}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full rounded-2xl border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                Write Online Instead
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[2.5rem] max-w-2xl w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden">
                                            <DialogHeader className="p-6 md:p-8 pb-0">
                                                <DialogTitle className="text-2xl font-black flex items-center justify-between">
                                                    <span>Write Your 20 Goals</span>
                                                </DialogTitle>
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
                                                        &larr; Previous Day
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
                                                        Next Day &rarr;
                                                    </Button>
                                                </div>
                                                <div className="mt-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-500">
                                                        ⚠️ നിങ്ങൾക്ക് ഓഫ്‌ലൈൻ ആയി ബുക്കിൽ എഴുതാൻ സൗകര്യമില്ലെങ്കിൽ മാത്രമാണ് ഓൺലൈൻ ആയി എഴുതേണ്ടത്.
                                                    </p>
                                                </div>
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
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                                
                                                {/* Goals List */}
                                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 mb-4">
                                                        {goalCategories[activeCategoryIdx]} Goals
                                                    </h3>
                                                    {[0, 1, 2, 3, 4].map((goalIdx) => {
                                                        const isPast = selectedDate < new Date().toISOString().split('T')[0];
                                                        const catName = goalCategories[activeCategoryIdx];
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
                                                                    disabled={isPast}
                                                                    placeholder={`Write goal #${goalIdx + 1}...`}
                                                                    className={cn(
                                                                        "h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-indigo-500",
                                                                        isPast ? "opacity-70 cursor-not-allowed" : ""
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
                                            <div className="p-6 md:p-8 pt-0 flex justify-end gap-3 mt-auto">
                                                <Button variant="ghost" onClick={() => setIsWritingGoalsOnline(false)} className="rounded-2xl px-8">Close</Button>
                                                <Button onClick={() => {
                                                    toast.success(`Goals saved for ${new Date(selectedDate).toLocaleDateString()}!`);
                                                    setIsWritingGoalsOnline(false);
                                                }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 font-black shadow-xl shadow-indigo-500/20">
                                                    Save Goals
                                                </Button>
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
