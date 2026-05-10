"use client";

import { TrendingUp, ArrowUpRight, Lock, Sparkles, Coins, Wallet, Gem, Landmark, Crown, Building2, Trophy, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TARGETS = [
    { label: "10 Cr", value: 100000000, icon: Crown,     color: "text-amber-500 bg-amber-500/10" },
    { label: "5 Cr",  value: 50000000,  icon: Building2, color: "text-purple-500 bg-purple-500/10" },
    { label: "1 Cr",  value: 10000000,  icon: Trophy,    color: "text-amber-400 bg-amber-400/10" },
    { label: "50 L",  value: 5000000,   icon: Landmark,  color: "text-blue-500 bg-blue-500/10" },
    { label: "10 L",  value: 1000000,   icon: Gem,       color: "text-rose-500 bg-rose-500/10" },
    { label: "5 L",   value: 500000,    icon: Wallet,    color: "text-emerald-500 bg-emerald-500/10" },
    { label: "1 L",   value: 100000,    icon: Coins,     color: "text-violet-500 bg-violet-500/10" },
    { label: "Start", value: 0,         icon: MapPin,    color: "text-slate-500 bg-slate-500/10" },
];

interface RevenueLadderProps {
    currentIncome: number;
}

export const RevenueLadder = ({ currentIncome }: RevenueLadderProps) => {
    return (
        <Card className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl shadow-xl overflow-hidden">
            <CardHeader className="pb-2 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black">Revenue Ladder</CardTitle>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Your growth path</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
                {/* Current Income Card */}
                <div className="relative group overflow-hidden p-5 rounded-[2rem] bg-slate-900 text-white shadow-xl">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1 opacity-70">Achieved Revenue</p>
                        <h3 className="text-2xl font-black flex items-baseline gap-2">
                            ₹{currentIncome.toLocaleString()}
                            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                        </h3>
                    </div>
                    <div className="absolute -right-2 -bottom-2 h-16 w-16 bg-emerald-500/10 rounded-full blur-xl" />
                </div>

                {/* The Ladder */}
                <div className="relative space-y-2">
                    {TARGETS.map((target, index) => {
                        const isReached = currentIncome >= target.value;
                        const isNext = !isReached && (TARGETS[index + 1]?.value <= currentIncome || index === TARGETS.length - 1);
                        const Icon = target.icon;

                        return (
                            <div key={target.label} className="relative group">
                                <div className={cn(
                                    "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-500",
                                    isReached
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                                        : isNext
                                            ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/20 scale-[1.02]"
                                            : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60"
                                )}>
                                    {/* Icon Container */}
                                    <div className={cn(
                                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-500",
                                        isReached ? target.color : isNext ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                                    )}>
                                        <Icon className={cn("h-4.5 w-4.5", isNext ? "text-white" : "")} />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black tracking-tight">{target.label}</span>
                                            {isReached ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : isNext ? (
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Next Goal</span>
                                            ) : (
                                                <Lock className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
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
