"use client";

import { Check, Lock, Sparkles, Rocket, Target, Award, Crown, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Default style mapping for common milestones
const STYLE_MAP: Record<string, any> = {
    "Starter": { icon: Rocket, color: "from-blue-500 to-cyan-500" },
    "10 Days Video": { icon: Target, color: "from-rose-500 to-orange-500" },
    "Freedom Finisher": { icon: Award, color: "from-emerald-500 to-teal-500" },
    "HOF": { icon: Trophy, color: "from-amber-500 to-yellow-500" },
    "1 Cr Champion": { icon: Crown, color: "from-violet-600 to-purple-600" },
};

interface AchievementJourneyProps {
    currentLevelIndex: number;
    milestoneNames: string[];
}

export const AchievementJourney = ({ currentLevelIndex, milestoneNames }: AchievementJourneyProps) => {
    const milestones = milestoneNames.map(name => ({
        name,
        icon: STYLE_MAP[name]?.icon || Star,
        color: STYLE_MAP[name]?.color || "from-slate-500 to-slate-700"
    }));

    const progress = milestones.length > 1 ? (currentLevelIndex / (milestones.length - 1)) * 100 : 100;

    return (
        <Card className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl shadow-xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-3 p-6">
                <div>
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                        Achievement Journey
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Scale your success</p>
                </div>
                <div className="bg-slate-900 text-white px-3 py-1 rounded-xl shadow-lg">
                    <span className="text-xs font-black">{Math.round(progress)}%</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-8 md:pt-12 pb-6 md:pb-10 overflow-visible">
                <div className="relative flex items-center justify-between gap-4 md:gap-10 overflow-x-auto pb-6 scrollbar-hide px-6 md:px-12 py-4 -mx-2 md:-mx-4">
                    {/* Connecting Line Background */}
                    <div className="absolute top-[52px] md:top-[68px] left-12 md:left-24 right-12 md:right-24 h-1.5 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full -z-0" />
                    
                    {/* Active Connecting Line */}
                    <div 
                        className="absolute top-[52px] md:top-[68px] left-12 md:left-24 h-1.5 md:h-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full -z-0 transition-all duration-1000 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                        style={{ width: `calc(${progress}% - ${typeof window !== 'undefined' && window.innerWidth < 768 ? '48px' : '96px'})` }}
                    />

                    {milestones.map((m, i) => {
                        const isCompleted = i < currentLevelIndex;
                        const isCurrent   = i === currentLevelIndex;
                        const isLocked    = i > currentLevelIndex;
                        const Icon = m.icon;

                        return (
                            <div key={m.name} className="relative z-10 flex flex-col items-center min-w-[100px] md:min-w-[150px] gap-4 md:gap-6 group">
                                {/* Milestone Node */}
                                <div 
                                    className={cn(
                                        "h-16 w-16 md:h-24 md:w-24 flex items-center justify-center border-2 transition-all duration-700 relative overflow-hidden",
                                        isCompleted 
                                            ? "bg-slate-900 border-white dark:border-slate-800 text-white shadow-2xl"
                                            : isCurrent
                                                ? "bg-white dark:bg-slate-950 border-violet-600 text-violet-600 scale-110 shadow-2xl ring-4 md:ring-8 ring-violet-500/10"
                                                : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300"
                                    )}
                                    style={{ borderRadius: typeof window !== 'undefined' && window.innerWidth < 768 ? '1.5rem' : '2.5rem' }} 
                                >
                                    <div className={cn(
                                        "transition-all duration-500 relative z-10",
                                        isCurrent && "animate-bounce",
                                        isLocked && "opacity-30 blur-[0.5px]"
                                    )}>
                                        <Icon className={cn("h-7 w-7 md:h-10 md:w-10")} />
                                    </div>

                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
                                            <Lock className="h-5 w-5 text-slate-400 opacity-60" />
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-emerald-500 rounded-full p-0.5 md:p-1 border-2 border-white dark:border-slate-900 shadow-md">
                                            <Check className="h-2 w-2 md:h-3 md:w-3 text-white stroke-[4]" />
                                        </div>
                                    )}
                                </div>

                                {/* Milestone Info */}
                                <div className="text-center space-y-2">
                                    <h5 className={cn(
                                        "text-xs font-black uppercase tracking-widest transition-colors duration-300",
                                        isLocked ? "text-slate-400" : "text-slate-900 dark:text-slate-100"
                                    )}>
                                        {m.name}
                                    </h5>
                                    <div className={cn(
                                        "inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm",
                                        isCompleted ? "bg-emerald-500/10 text-emerald-600" : 
                                        isCurrent ? "bg-violet-600 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {isCompleted ? "Completed" : isCurrent ? "Active" : "Locked"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
