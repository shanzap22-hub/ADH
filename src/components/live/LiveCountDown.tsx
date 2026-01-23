// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { intervalToDuration, isBefore } from "date-fns";

interface LiveCountDownProps {
    targetDate: string; // ISO string (Start)
    endDate?: string; // ISO string (End)
}

export const LiveCountDown = ({ targetDate, endDate }: LiveCountDownProps) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [status, setStatus] = useState<'waiting' | 'live' | 'ended'>('waiting');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const start = new Date(targetDate);
            // Default to 1 hour duration if no end date provided, for backward compatibility
            const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000);

            if (now > end) {
                setStatus('ended');
                return;
            }

            if (now >= start) {
                setStatus('live');
                return;
            }

            setStatus('waiting');

            const duration = intervalToDuration({
                start: now,
                end: start
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
    }, [targetDate, endDate]);

    if (status === 'live') {
        return <div className="text-red-600 font-bold animate-pulse text-sm">🔴 LIVE NOW</div>;
    }

    if (status === 'ended') {
        return <div className="text-gray-500 font-medium text-sm">Session Ended</div>;
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
