"use client";

import { useState } from "react";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, CheckCircle2, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { StudentProgressCalendar } from "./StudentProgressCalendar";

interface Ritual {
    id: string;
    ritual_name: string;
}

interface StudentTracker {
    id: string;
    full_name: string;
    email: string;
    gamification_score: number;
    completed_rituals: string[];
    progress_percentage: number;
}

interface MyJourneyTrackerProps {
    students: StudentTracker[];
    rituals: Ritual[];
    selectedDate: string;
}

export const MyJourneyTracker = ({ students, rituals, selectedDate }: MyJourneyTrackerProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const router = useRouter();

    const totalRituals = rituals.length || 1; // Prevent div by 0

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = true;
        if (filter === "active") {
            matchesFilter = student.completed_rituals.length > 0;
        } else if (filter === "inactive") {
            matchesFilter = student.completed_rituals.length === 0;
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-6 px-6 sm:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-black text-slate-800 dark:text-slate-100">
                        {selectedDate === new Date().toISOString().split('T')[0] 
                            ? "Today's Progress" 
                            : `Progress for ${selectedDate}`}
                    </CardTitle>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl w-full"
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        router.replace(`?date=${e.target.value}`, { scroll: false });
                                    }
                                }}
                                className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 px-3 outline-none"
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            {(["all", "active", "inactive"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                                        filter === f 
                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-100 dark:border-slate-800/50 hover:bg-transparent">
                            <TableHead className="pl-6 sm:pl-8">Student</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Completed Tasks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map((student) => (
                            <TableRow 
                                key={student.id} 
                                className="border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                onClick={() => setSelectedStudentId(student.id)}
                            >
                                <TableCell className="pl-6 sm:pl-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shadow-inner">
                                            {student.full_name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{student.full_name}</p>
                                            <p className="text-xs text-slate-500">{student.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-black text-amber-600 dark:text-amber-500">
                                        🏆 {student.gamification_score}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-1000 rounded-full",
                                                    student.progress_percentage === 100 ? "bg-emerald-500" : 
                                                    student.progress_percentage > 0 ? "bg-indigo-500" : "bg-transparent"
                                                )}
                                                style={{ width: `${student.progress_percentage}%` }}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            student.progress_percentage === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                                        )}>
                                            {Math.round(student.progress_percentage)}%
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {rituals.map(ritual => {
                                            const isDone = student.completed_rituals.includes(ritual.id);
                                            return (
                                                <div 
                                                    key={ritual.id} 
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider",
                                                        isDone 
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                                                            : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700"
                                                    )}
                                                    title={ritual.ritual_name}
                                                >
                                                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-50" />}
                                                    <span className="truncate max-w-[80px]">{ritual.ritual_name.split(' ')[0]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                                    No students found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            
            {/* Student Calendar Modal */}
            <StudentProgressCalendar 
                studentId={selectedStudentId} 
                studentName={students.find(s => s.id === selectedStudentId)?.full_name || ""}
                onClose={() => setSelectedStudentId(null)} 
                totalRituals={rituals.length}
            />
        </Card>
    );
}
