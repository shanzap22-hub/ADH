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
            if (data?.goal_card_text) setGoalText(data.goal_card_text);
        };
        fetchGoal();
    }, [supabase]);

    const saveGoal = async () => {
        if (!goalText.trim()) return toast.error("Please enter a goal");
        
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("user_rituals_data")
            .upsert({ 
                user_id: user.id, 
                goal_card_text: goalText, 
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
                pixelRatio: 2,
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
        <div className="space-y-6">
            {/* Visual Card Display */}
            <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                <div 
                    ref={cardRef}
                    className="relative aspect-[16/9] w-full bg-slate-900 p-8 flex flex-col items-center justify-center text-center"
                >
                    {/* Background Pattern/Logo */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                        <Image src="/logo.png" alt="" width={400} height={400} className="grayscale brightness-200" />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]" />

                    <div className="relative z-10 space-y-4 max-w-[80%]">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                            <Target className="h-5 w-5 text-emerald-400" />
                        </div>
                        <h4 className="text-emerald-400 font-black italic text-lg sm:text-xl tracking-tight opacity-80">
                            "I am so happy and grateful now that..."
                        </h4>
                        <div className="min-h-[60px] flex items-center justify-center">
                            <p className="text-white text-xl sm:text-3xl font-black leading-tight drop-shadow-lg break-words">
                                {goalText || "Your main goal will appear here..."}
                            </p>
                        </div>
                    </div>

                    {/* Corner Logo */}
                    <div className="absolute bottom-6 right-6 opacity-30">
                        <Image src="/logo.png" alt="ADH" width={60} height={20} className="h-4 w-auto grayscale brightness-200" />
                    </div>
                </div>

                {/* Overlay Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        onClick={() => setIsEditing(!isEditing)}
                        className="rounded-xl h-10 w-10 shadow-lg"
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

            {/* Editing Section */}
            {isEditing && (
                <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-950 border-2 border-violet-500/20 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between px-2">
                        <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Update Your Goal</h5>
                    </div>
                    <Textarea 
                        value={goalText}
                        onChange={(e) => setGoalText(e.target.value)}
                        placeholder="e.g. I am earning 5 Lakhs per month..."
                        className="min-h-[120px] rounded-2xl border-slate-100 dark:border-slate-800 focus-visible:ring-violet-500 font-bold text-lg p-4"
                    />
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
