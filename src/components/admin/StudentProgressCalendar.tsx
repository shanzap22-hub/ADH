"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentProgressCalendarProps {
    studentId: string | null;
    studentName: string;
    onClose: () => void;
    totalRituals: number;
}

export const StudentProgressCalendar = ({ studentId, studentName, onClose, totalRituals }: StudentProgressCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!studentId) return;

        const fetchLogs = async () => {
            setLoading(true);
            const startDate = startOfMonth(currentMonth).toISOString().split('T')[0];
            const endDate = endOfMonth(currentMonth).toISOString().split('T')[0];

            try {
                // Admin API route ഉപയോഗിക്കുന്നു — RLS bypass ചെയ്യാൻ
                const res = await fetch(`/api/admin/student-calendar?student_id=${studentId}&start_date=${startDate}&end_date=${endDate}`);
                const data = await res.json();
                
                if (data.logs) {
                    setLogs(data.logs);
                } else {
                    setLogs([]);
                }
            } catch (err) {
                console.error("Calendar fetch error:", err);
                setLogs([]);
            }
            setLoading(false);
        };

        fetchLogs();
    }, [studentId, currentMonth]);

    if (!studentId) return null;

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const getProgressForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dateLogs = logs.filter(log => log.completed_date === dateStr);
        const uniqueRituals = new Set(dateLogs.map(log => log.ritual_id)).size;
        return (uniqueRituals / Math.max(1, totalRituals)) * 100;
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <Dialog open={!!studentId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-none rounded-3xl shadow-2xl">
                <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black">{studentName}&apos;s Progress</DialogTitle>
                        <DialogDescription className="text-indigo-100 mt-1">
                            Daily completion history
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800/50" />
                            <span>No activity</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-200" />
                            <span>Partial</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-500" />
                            <span>100%</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-bold text-slate-400 mb-2">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Empty cells for padding start of month */}
                            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {daysInMonth.map(date => {
                                const progress = getProgressForDate(date);
                                const isCurrentDay = isToday(date);
                                
                                // Color mapping based on progress
                                let bgClass = "bg-slate-100 dark:bg-slate-800/50";
                                let textClass = "text-slate-500";
                                
                                if (progress === 100) {
                                    bgClass = "bg-emerald-500 shadow-md shadow-emerald-500/20";
                                    textClass = "text-white font-bold";
                                } else if (progress > 50) {
                                    bgClass = "bg-emerald-400/80";
                                    textClass = "text-white font-bold";
                                } else if (progress > 0) {
                                    bgClass = "bg-emerald-200 dark:bg-emerald-900/50";
                                    textClass = "text-emerald-800 dark:text-emerald-300 font-bold";
                                }

                                return (
                                    <div 
                                        key={date.toISOString()}
                                        className={cn(
                                            "aspect-square rounded-xl flex flex-col items-center justify-center transition-all",
                                            bgClass,
                                            isCurrentDay && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950"
                                        )}
                                        title={`${format(date, "MMM d, yyyy")} - ${Math.round(progress)}% completed`}
                                    >
                                        <span className={cn("text-sm", textClass)}>{format(date, "d")}</span>
                                        {progress > 0 && (
                                            <span className={cn("text-[9px] font-bold mt-0.5", textClass)}>
                                                {Math.round(progress)}%
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
