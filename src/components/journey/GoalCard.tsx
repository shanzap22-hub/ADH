"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Edit3, Save, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import * as htmlToImage from "html-to-image";

export const GoalCard = () => {
    const [goalText, setGoalText] = useState("");
    const [goalDate, setGoalDate] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchGoal = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("user_rituals_data")
                .select("goal_card_text")
                .eq("user_id", user.id)
                .single();
            if (data?.goal_card_text) {
                try {
                    const parsed = JSON.parse(data.goal_card_text);
                    setGoalText(parsed.text || "");
                    setGoalDate(parsed.date || "");
                } catch {
                    setGoalText(data.goal_card_text);
                }
            }
        };
        fetchGoal();
    }, [supabase]);

    const saveGoal = async () => {
        if (!goalText.trim()) return toast.error("Please enter a goal");
        
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const goalData = JSON.stringify({ text: goalText, date: goalDate });

        const { error } = await supabase
            .from("user_rituals_data")
            .upsert({ 
                user_id: user.id, 
                goal_card_text: goalData, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });

        if (error) {
            console.error("Save error:", error);
            toast.error("Failed to save: " + error.message);
        } else {
            toast.success("Goal Card Updated!");
            setIsEditing(false);
        }
        setIsLoading(false);
    };

    const downloadCard = async () => {
        if (cardRef.current === null) return;
        
        const loadingToast = toast.loading("Generating card...");
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#0f172a',
            });
            const link = document.createElement('a');
            link.download = 'my-goal-card.png';
            link.href = dataUrl;
            link.click();
            toast.success("Card downloaded!", { id: loadingToast });
        } catch (err) {
            toast.error("Failed to generate image", { id: loadingToast });
        }
    };

    return (
        <div className="space-y-4">
            {/* Goal Card — Downloadable Visual */}
            <div className="relative group overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                <div 
                    ref={cardRef}
                    className="relative w-full bg-slate-900 p-10 sm:p-12"
                    style={{ minHeight: '300px', aspectRatio: '16/9' }}
                >
                    {/* Background Logo — വളരെ subtle ആയിട്ട് മാത്രം */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.03 }}>
                        <Image src="/logo.png" alt="" width={500} height={500} className="grayscale brightness-200" />
                    </div>

                    {/* Decorative thin border inside */}
                    <div className="absolute inset-3 border border-white/[0.06] rounded-[1.5rem] pointer-events-none" />

                    {/* Card Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-5">
                        {/* Date Header */}
                        <p className="text-white/50 text-[11px] font-bold uppercase tracking-[0.25em]">
                            My Goal by {goalDate ? (
                                <span className="text-amber-400/90 border-b border-dashed border-amber-400/40 pb-0.5 ml-1">{goalDate}</span>
                            ) : (
                                <span className="text-white/25 border-b border-dashed border-white/15 pb-0.5 ml-1">_______ 20_____</span>
                            )}
                        </p>

                        {/* Header Quote */}
                        <h4 className="text-emerald-400/90 font-black italic text-sm sm:text-base tracking-tight">
                            &quot;I am so happy and grateful now that...&quot;
                        </h4>

                        {/* Main Goal Text */}
                        <div className="min-h-[80px] flex items-center justify-center max-w-[90%]">
                            <p className="text-white text-xl sm:text-2xl md:text-3xl font-black leading-snug drop-shadow-lg break-words">
                                {goalText || "Your main goal will appear here..."}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Right Logo — subtle */}
                    <div className="absolute bottom-5 right-7" style={{ opacity: 0.15 }}>
                        <Image src="/logo.png" alt="ADH" width={60} height={20} className="h-4 w-auto grayscale brightness-200" />
                    </div>

                    {/* Bottom Left Branding */}
                    <div className="absolute bottom-5 left-7" style={{ opacity: 0.12 }}>
                        <p className="text-[7px] text-white font-bold uppercase tracking-[0.3em]">ATCESS Digital Hub</p>
                    </div>
                </div>

                {/* Hover Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        onClick={() => setIsEditing(!isEditing)}
                        className="rounded-xl h-10 w-10 shadow-lg backdrop-blur-sm bg-white/80 dark:bg-slate-800/80"
                    >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                    {!isEditing && goalText && (
                        <Button 
                            size="icon" 
                            onClick={downloadCard}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg h-10 w-10"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Visualization Instructions — കാർഡിന് പുറത്ത് */}
            <div className="px-3 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500 leading-relaxed">
                    📌 <span className="font-black">How to Visualize:</span> Close your eyes, take a deep breath, and picture this goal as already achieved. 
                    Feel the emotions — the joy, the gratitude. See the details clearly in your mind for 5 minutes every day. 
                    The more you feel it, the faster it manifests.
                </p>
            </div>

            {/* Editing Section */}
            {isEditing && (
                <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-950 border-2 border-violet-500/20 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between px-2">
                        <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Update Your Goal Card</h5>
                    </div>

                    {/* Date Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                            Target Date (e.g. December 2026)
                        </label>
                        <input 
                            type="text"
                            value={goalDate}
                            onChange={(e) => setGoalDate(e.target.value)}
                            placeholder="e.g. March 2027"
                            className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus-visible:ring-2 focus-visible:ring-violet-500 outline-none font-bold text-base"
                        />
                    </div>

                    {/* Goal Text */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                            Your Goal
                        </label>
                        <Textarea 
                            value={goalText}
                            onChange={(e) => setGoalText(e.target.value)}
                            placeholder="e.g. I am earning 5 Lakhs per month from my digital business..."
                            className="min-h-[120px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus-visible:ring-violet-500 font-bold text-lg p-4"
                        />
                    </div>

                    <Button 
                        onClick={saveGoal}
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black shadow-lg shadow-violet-500/20 gap-2"
                    >
                        {isLoading ? "Saving..." : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
};
