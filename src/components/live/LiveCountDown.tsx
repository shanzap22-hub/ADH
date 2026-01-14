// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { intervalToDuration, isBefore } from "date-fns";

interface LiveCountDownProps {
    targetDate: string; // ISO string
}

export const LiveCountDown = ({ targetDate }: LiveCountDownProps) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const target = new Date(targetDate);

        const calculateTimeLeft = () => {
            const now = new Date();

            if (isBefore(target, now)) {
                // Check if likely still live (e.g. within 2 hours?)
                // For now just say "Live Now" or "Finished"
                // Assuming it's the start time.
                setIsLive(true);
                return;
            }

            const duration = intervalToDuration({
                start: now,
                end: target
            });

            setTimeLeft({
                days: duration.days || 0,
                hours: duration.hours || 0,
                minutes: duration.minutes || 0,
                seconds: duration.seconds || 0
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (isLive) {
        return <div className="text-red-600 font-bold animate-pulse">🔴 LIVE NOW</div>;
    }

    return (
        <div className="flex gap-2 text-sm font-mono text-slate-600 dark:text-slate-300">
            <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 p-2 rounded min-w-[50px]">
                <span className="text-xl font-bold text-purple-600">{timeLeft.days}</span>
                <span className="text-xs">Days</span>
            </div>
            <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 p-2 rounded min-w-[50px]">
                <span className="text-xl font-bold text-purple-600">{timeLeft.hours}</span>
                <span className="text-xs">Hrs</span>
            </div>
            <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 p-2 rounded min-w-[50px]">
                <span className="text-xl font-bold text-purple-600">{timeLeft.minutes}</span>
                <span className="text-xs">Min</span>
            </div>
            <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 p-2 rounded min-w-[50px]">
                <span className="text-xl font-bold text-purple-600">{timeLeft.seconds}</span>
                <span className="text-xs">Sec</span>
            </div>
        </div>
    );
};
