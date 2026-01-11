import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefundButton } from "@/components/admin/RefundButton";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, User as UserIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
    const supabase = await createClient();

    // Verify Super Admin (Double check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') redirect("/dashboard");

    // Fetch transactions
    const { data: payments } = await supabase
        .from("payments_temp")
        .select("*")
        .order("created_at", { ascending: false });

    // Fetch corresponding user profiles to calculate "Days Joined"
    // Using loose match on Phone Number since we don't store user_id in payments_temp yet
    let profilesMap: Record<string, any> = {};

    if (payments && payments.length > 0) {
        const phoneNumbers = payments
            .map(p => p.whatsapp_number)
            .filter(Boolean);

        if (phoneNumbers.length > 0) {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("contact_number, full_name, email, created_at")
                .in("contact_number", phoneNumbers);

            if (profiles) {
                profiles.reduce((acc, profile) => {
                    if (profile.contact_number) acc[profile.contact_number] = profile;
                    return acc;
                }, profilesMap);
            }
        }
    }

    const getDaysJoined = (dateString: string) => {
        if (!dateString) return "N/A";
        const joined = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joined.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-gray-600 mt-1">Monitor payments and manage refunds</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {!payments || payments.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No transactions found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User / Joined</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => {
                                    const userProfile = profilesMap[payment.whatsapp_number];
                                    const daysJoined = userProfile ? getDaysJoined(userProfile.created_at) : null;

                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                {userProfile ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{userProfile.full_name}</span>
                                                        <span className="text-xs text-gray-500">{userProfile.email}</span>
                                                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            {daysJoined} days ago
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-gray-400">
                                                        <UserIcon className="w-4 h-4 mr-2" />
                                                        Unknown User
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{payment.whatsapp_number}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center font-medium">
                                                    <IndianRupee className="h-3 w-3 mr-1" />
                                                    {(payment.amount / 100).toLocaleString('en-IN')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={payment.status === 'refunded' ? 'destructive' : 'secondary'} className={payment.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                                    {payment.status || 'Pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{payment.payment_id}</TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <RefundButton
                                                    paymentId={payment.payment_id}
                                                    amount={payment.amount}
                                                    isRefunded={payment.status === 'refunded'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
