"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Trophy } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PointLog {
    id: string;
    user_id: string;
    action_type: string;
    points: number;
    description: string;
    created_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
}

export default function PointsLedger() {
    const [logs, setLogs] = useState<PointLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/admin/gamification/ledger");
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLogs(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-6">
                <CardTitle className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Gamification Points Ledger
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-100 dark:border-slate-800/50 hover:bg-transparent">
                            <TableHead className="pl-6 py-4">Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right pr-6">Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-500" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                                    No points awarded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map(log => (
                                <TableRow key={log.id} className="border-slate-100 dark:border-slate-800/50">
                                    <TableCell className="pl-6 py-3 whitespace-nowrap text-xs text-slate-500">
                                        {format(new Date(log.created_at), "dd MMM yyyy, hh:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{log.profiles?.full_name || "Unknown"}</p>
                                        <p className="text-[10px] text-slate-500">{log.profiles?.email}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 capitalize">
                                            {log.action_type.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                        {log.description}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <span className={`font-black text-sm ${log.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                            {log.points > 0 ? "+" : ""}{log.points}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
