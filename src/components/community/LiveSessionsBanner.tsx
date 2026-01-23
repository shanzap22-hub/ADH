"use client";

import { useEffect, useState } from "react";
import { format, isToday, isTomorrow, differenceInSeconds } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";

interface LiveSessionsBannerProps {
    weeklySessions: any[];
    bookings: any[];
}

export function LiveSessionsBanner({ weeklySessions, bookings }: LiveSessionsBannerProps) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!now) return null; // Avoid hydration mismatch

    // Combine and Normalize Data
    const allSessions = [
        ...weeklySessions.map(s => ({
            id: s.id,
            title: s.title || "Weekly Live Session",
            start: new Date(s.scheduled_at),
            end: s.end_time ? new Date(s.end_time) : new Date(new Date(s.scheduled_at).getTime() + 60 * 60 * 1000),
            link: s.join_url,
            type: 'weekly'
        })),
        ...bookings.map(b => ({
            id: b.id,
            title: `1-on-1 with ${b.profiles?.full_name || 'Instructor'}`,
            start: new Date(b.start_time),
            end: new Date(b.end_time),
            link: b.meet_link,
            type: '1on1'
        }))
    ];

    // Filter & Sort
    const upcoming = allSessions.filter(s => {
        const isrelevantDay = isToday(s.start) || isTomorrow(s.start);
        // Only show if not ended (buffer 10 mins?) or strictly not ended
        const isNotFinished = s.end > now;
        return isrelevantDay && isNotFinished;
    }).sort((a, b) => a.start.getTime() - b.start.getTime());

    if (upcoming.length === 0) return null;

    return (
        <div className="mb-8 space-y-3">
            {upcoming.map(session => (
                <SessionCard key={session.id} session={session} now={now} />
            ))}
        </div>
    );
}

function SessionCard({ session, now }: { session: any, now: Date }) {
    const isLive = now >= session.start && now <= session.end;
    const diffSecs = differenceInSeconds(session.start, now);

    // Countdown text
    let countdownText = "";
    if (isLive) {
        countdownText = "LIVE NOW";
    } else if (diffSecs > 0) {
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;

        if (h > 0) {
            countdownText = `Starts in ${h}h ${m}m ${s}s`;
        } else if (m > 0) {
            countdownText = `Starts in ${m}m ${s}s`;
        } else {
            countdownText = `Starts in ${s}s`;
        }
    } else {
        countdownText = "Starting soon...";
    }

    const dayLabel = isToday(session.start) ? "TODAY" : "TOMORROW";

    return (
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-md transition-all">
            {/* Vertical Label */}
            <div className={cn(
                "w-8 flex items-center justify-center py-2 shrink-0",
                dayLabel === "TODAY" ? "bg-red-500" : "bg-blue-600"
            )}>
                <span className="text-[10px] font-extrabold tracking-widest text-white whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {dayLabel}
                </span>
            </div>

            <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm md:text-base flex items-center gap-2">
                        {session.type === 'weekly' && <Video className="w-3 h-3 text-slate-400" />}
                        {session.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {format(session.start, "h:mm a")} - {format(session.end, "h:mm a")}
                        </span>

                        <span className={cn("font-bold flex items-center gap-1", isLive ? "text-red-600 animate-pulse" : "text-indigo-600")}>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                            {countdownText}
                        </span>
                    </div>
                </div>

                <Button
                    size="sm"
                    variant={isLive ? "default" : "outline"}
                    className={cn(
                        "rounded-full px-4 font-bold shadow-none transition-all h-8 text-xs shrink-0",
                        isLive
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    )}
                    asChild
                >
                    <a href={session.link} target="_blank" rel="noreferrer">
                        {isLive ? "JOIN NOW" : "Join"}
                    </a>
                </Button>
            </div>
        </div>
    )
}
