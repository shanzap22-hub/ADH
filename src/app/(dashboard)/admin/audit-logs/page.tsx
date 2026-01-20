import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
    const supabase = await createClient();

    // Fetch logs
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching audit logs:", error);
    }

    let logsWithProfile: any[] = [];

    if (logs && logs.length > 0) {
        const userIds = Array.from(new Set(logs.map((l: any) => l.user_id).filter(Boolean)));

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .in('id', userIds);

            logsWithProfile = logs.map((log: any) => ({
                ...log,
                profile: profiles?.find((p: any) => p.id === log.user_id)
            }));
        } else {
            logsWithProfile = logs;
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600 mt-1">History of critical admin actions</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logsWithProfile.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                        {format(new Date(log.created_at), "dd MMM HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm">{log.profile?.full_name || "Unknown"}</div>
                                        <div className="text-xs text-muted-foreground">{log.profile?.email || log.user_id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {log.entity_type}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-gray-500 max-w-[300px] truncate" title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {(!logsWithProfile || logsWithProfile.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ShieldAlert className="h-8 w-8 opacity-20" />
                                            <p>No audit records found yet.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
