"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays, subDays } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus, Edit, Filter, Search, RefreshCcw, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function TransactionsManager() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("verified"); // 'verified' | 'pending' | 'all'

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [tierFilter, setTierFilter] = useState("all");
    const [daysFilter, setDaysFilter] = useState("");
    const [dateFilterType, setDateFilterType] = useState("within"); // 'within' | 'older'
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [selectedProgress, setSelectedProgress] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRefundOpen, setIsRefundOpen] = useState(false);

    // Selection for Edit/Refund
    const [selectedTxn, setSelectedTxn] = useState<any>(null);

    // Form Data
    const [formData, setFormData] = useState({
        amount: "",
        student_name: "",
        whatsapp_number: "",
        email: "",
        membership_plan: "silver",
        notes: "",
        source: "manual"
    });

    // ... (lines 78-151 are mostly fine, check handleSave payload construction if generic)
    // handleSave spreads formData. If we changed keys, payload changes. API expects `email`, `whatsapp_number`.
    // My API change above expects `email`, `whatsapp_number`. So this matches!

    // Need to check handleEdit (line 494) and Inputs.

    /* ... Skipping to handleEdit implementation below ... */

    // --- 2. Edit Transaction --- (This part needs manual update in replace)
    /* 
       Note: I will perform multiple replace calls or one large one. 
       This replacement covers state init.
    */


    // Refund Confirmation
    const [refundConfirmText, setRefundConfirmText] = useState("");
    const [isRefunding, setIsRefunding] = useState(false);

    useEffect(() => {
        // When Days Filter changes, update Start/End Date automatically
        if (daysFilter) {
            const days = parseInt(daysFilter);
            if (!isNaN(days) && days > 0) {
                const targetDate = subDays(new Date(), days);

                if (dateFilterType === 'within') {
                    // Joined WITHIN last X days
                    setStartDate(format(targetDate, "yyyy-MM-dd"));
                    setEndDate(format(new Date(), "yyyy-MM-dd"));
                } else {
                    // Joined OLDER THAN X days (Transactions before X days ago)
                    setStartDate(""); // From beginning
                    setEndDate(format(targetDate, "yyyy-MM-dd"));
                }
            }
        }
    }, [daysFilter, dateFilterType]);

    useEffect(() => {
        fetchTransactions();
    }, [activeTab, startDate, endDate, tierFilter]);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'all') params.set("status", activeTab);

            if (startDate) params.set("start_date", new Date(startDate).toISOString());
            if (endDate) params.set("end_date", new Date(endDate).toISOString());
            if (tierFilter !== "all") params.set("tier", tierFilter);
            if (searchQuery) params.set("search_query", searchQuery); // Added Search Param

            const res = await fetch(`/api/admin/transactions?${params.toString()}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);
            setTransactions(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(isEdit: boolean) {
        try {
            const url = "/api/admin/transactions";
            const method = isEdit ? "PUT" : "POST";
            const payload = isEdit
                ? { ...formData, id: selectedTxn.id, amount: Math.round(Number(formData.amount || 0) * 100) }
                : { ...formData, status: 'verified', amount: Math.round(Number(formData.amount || 0) * 100) };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success(isEdit ? "Transaction Updated" : "Transaction Added");
            setIsAddOpen(false);
            setIsEditOpen(false);
            fetchTransactions();

            setFormData({
                amount: "",
                student_name: "",
                student_phone: "",
                whatsapp_number: "",
                student_email: "",
                membership_plan: "silver",
                notes: "",
                source: "manual"
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    async function handleRefund() {
        if (refundConfirmText.toLowerCase() !== "refund") {
            toast.error("Please type 'refund' correctly to confirm.");
            return;
        }

        setIsRefunding(true);
        try {
            const res = await fetch("/api/razorpay/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: selectedTxn.razorpay_payment_id })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Refund Processed Successfully");
            setIsRefundOpen(false);
            setRefundConfirmText("");
            fetchTransactions();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRefunding(false);
        }
    }

    async function handleSync() {
        const toastId = toast.loading("Syncing legacy data...");
        try {
            const res = await fetch("/api/admin/transactions/sync", { method: "POST" });
            const data = await res.json();
            toast.dismiss(toastId);

            if (data.error) throw new Error(data.error);

            toast.success(data.count > 0 ? `Synced/Updated ${data.count} records!` : "Data verified.");
            fetchTransactions();
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    }

    async function handleExportSheet() {
        const confirmExport = confirm("This will export ALL transactions to the Google Sheet. It may take a while and result in duplicates if unrelated data exists. Continue?");
        if (!confirmExport) return;

        const toastId = toast.loading("Exporting all data to Sheet... Do not close window.");
        try {
            const res = await fetch("/api/admin/transactions/export-sheet", { method: "POST" });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.dismiss(toastId);
            toast.success(`Export Complete! Sent ${data.count} of ${data.total} records.`);
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error("Export Failed: " + error.message);
        }
    }

    // Calculations
    const totalAmount = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalCount = transactions.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaction Manager</h2>
                    <p className="text-muted-foreground">Manage payments, drop-offs, and manual entries.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportSheet} className="border-green-600 text-green-600 hover:bg-green-50">
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Sync New Data to Sheet
                    </Button>
                    <Button variant="outline" onClick={handleSync}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Sync Legacy Data
                    </Button>
                    <Button onClick={() => {
                        setEditingTxn(null);
                        setFormData({
                            email: "",
                            student_name: "",
                            whatsapp_number: "",
                            amount: "",
                            membership_plan: "silver",
                            notes: "",
                            source: "manual"
                        });
                        setIsAddOpen(true);
                    }} className="bg-primary">
                        <Plus className="mr-2 h-4 w-4" /> Add Manual Payment
                    </Button>
                </div>

            </div>


            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Filtered)</CardTitle>
                        <span className="text-muted-foreground">₹</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(totalAmount / 100).toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Calculated from loaded rows
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Count</CardTitle>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Filter By Days</Label>
                        <div className="flex gap-2">
                            <Select value={dateFilterType} onValueChange={(v) => { setDateFilterType(v); setDaysFilter(""); }}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="within">Within</SelectItem>
                                    <SelectItem value="older">Older Than</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Days"
                                value={daysFilter}
                                onChange={e => setDaysFilter(e.target.value)}
                                className="w-[80px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 w-full md:w-auto flex-grow">
                        <Label>Search User</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Name, Email, Phone..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        fetchTransactions();
                                    }
                                }}
                                className="pl-8 w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDaysFilter(""); }} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDaysFilter(""); }} />
                    </div>
                    <div className="space-y-2">
                        <Label>Membership Tier</Label>
                        <Select value={tierFilter} onValueChange={setTierFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Tiers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tiers</SelectItem>
                                <SelectItem value="bronze">Bronze</SelectItem>
                                <SelectItem value="silver">Silver</SelectItem>
                                <SelectItem value="gold">Gold</SelectItem>
                                <SelectItem value="diamond">Diamond</SelectItem>
                                <SelectItem value="platinum">Platinum</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setDaysFilter(""); setTierFilter("all"); }}>
                        Clear
                    </Button>
                </CardContent>
            </Card>

            {/* Tabs & Table */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="verified">Paid Transactions</TabsTrigger>
                    <TabsTrigger value="pending">Drop-offs (Incomplete)</TabsTrigger>
                    <TabsTrigger value="refunded">Refunded</TabsTrigger>
                    <TabsTrigger value="all">All Records</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Days Ago</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name / Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-10">
                                                <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                                                No records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (() => {
                                            // Group Transactions
                                            const grouped: Record<string, any[]> = {};
                                            transactions.forEach(txn => {
                                                const key = txn.user_id || txn.student_email?.toLowerCase() || txn.student_phone || txn.id;
                                                if (!grouped[key]) grouped[key] = [];
                                                grouped[key].push(txn);
                                            });

                                            // Sort groups by latest transaction date
                                            const sortedGroups = Object.values(grouped).sort((a, b) => {
                                                return new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime();
                                            });

                                            return sortedGroups.flatMap((group) => {
                                                return group.map((txn, index) => {
                                                    const isMain = index === 0;
                                                    const isSub = index > 0;
                                                    const daysAgo = differenceInDays(new Date(), new Date(txn.created_at));

                                                    return (
                                                        <TableRow
                                                            key={txn.id}
                                                            className={isSub ? "bg-muted/20 hover:bg-muted/30" : "hover:bg-slate-50"}
                                                        >
                                                            <TableCell className="font-medium text-slate-600">
                                                                {isSub && <span className="mr-2 text-muted-foreground">↳</span>}
                                                                {daysAgo} days
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                                {format(new Date(txn.created_at), "dd MMM yyyy")}
                                                            </TableCell>
                                                            <TableCell>
                                                                {isMain ? (
                                                                    <>
                                                                        <div className="font-medium text-sm">{txn.student_name || "Unknown"}</div>
                                                                        <div className="text-xs text-muted-foreground">{txn.email}</div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-xs text-muted-foreground opacity-50">Same as above</div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {isMain ? (txn.whatsapp_number || txn.profiles?.phone || "-") : ""}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-green-600 font-medium">
                                                                {isMain && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span>{txn.whatsapp_number || "-"}</span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>₹{(Number(txn.amount) / 100).toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                {txn.membership_plan ? (
                                                                    <Badge variant="secondary" className="capitalize text-xs">{txn.membership_plan}</Badge>
                                                                ) : "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {/* Only show progress on latest/main row to avoid confusion, or show for all if tracked separately? usually progress is user-level */}
                                                                {isMain && txn.student_progress ? (
                                                                    <div
                                                                        className="text-xs space-y-1 cursor-pointer hover:bg-white hover:shadow-sm p-1.5 rounded-md transition-all border border-transparent hover:border-slate-200"
                                                                        onClick={() => setSelectedProgress({
                                                                            student: txn.student_name || txn.email,
                                                                            progress: txn.student_progress
                                                                        })}
                                                                        title="Click to view detailed progress"
                                                                    >
                                                                        <div className="font-medium text-blue-600 flex items-center justify-between">
                                                                            <span>{txn.student_progress.courses_enrolled || 0} Course{txn.student_progress.courses_enrolled !== 1 ? 's' : ''}</span>
                                                                            <Search className="w-3 h-3 opacity-50" />
                                                                        </div>
                                                                        <div className="text-slate-600">
                                                                            {txn.student_progress.completed_chapters}/{txn.student_progress.total_chapters} Chapters
                                                                        </div>
                                                                        <div className="font-semibold text-green-600">
                                                                            {txn.student_progress.completion_percentage}% Complete
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    isMain ? <span className="text-xs text-muted-foreground text-center block">-</span> : <span className="text-xs text-center block opacity-30">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="capitalize text-xs">{txn.source}</TableCell>
                                                            <TableCell>
                                                                <Badge className={
                                                                    txn.status === 'verified' ? 'bg-green-500' :
                                                                        txn.status === 'pending' ? 'bg-yellow-500' :
                                                                            txn.status === 'refunded' ? 'bg-red-500' : 'bg-gray-500'
                                                                }>
                                                                    {txn.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                                        setSelectedTxn(txn);
                                                                        setFormData({
                                                                            amount: txn.amount ? (Number(txn.amount) / 100).toString() : "",
                                                                            student_name: txn.student_name || "",
                                                                            whatsapp_number: txn.whatsapp_number || "",
                                                                            student_email: txn.student_email || txn.email || "", // Handle both just in case, but prefer student_email for edit
                                                                            membership_plan: txn.membership_plan || "silver",
                                                                            notes: txn.notes || "",
                                                                            source: txn.source || "manual",
                                                                            // @ts-ignore
                                                                            status: txn.status || "verified"
                                                                        });
                                                                        setIsEditOpen(true);
                                                                    }}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>

                                                                    {txn.status === 'verified' && txn.source === 'razorpay' && (
                                                                        <Button variant="ghost" size="sm" title="Refund Transaction" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                                                            setSelectedTxn(txn);
                                                                            setRefundConfirmText("");
                                                                            setIsRefundOpen(true);
                                                                        }}>
                                                                            <RefreshCcw className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                });
                                            });
                                        })()
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Manual Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input className="col-span-3" value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">WhatsApp</Label>
                            <Input type="tel" className="col-span-3" value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input type="email" className="col-span-3" value={formData.student_email} onChange={e => setFormData({ ...formData, student_email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount (₹)</Label>
                            <Input type="number" className="col-span-3" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Plan</Label>
                            <Select value={formData.membership_plan} onValueChange={e => setFormData({ ...formData, membership_plan: e })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bronze">Bronze</SelectItem>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="gold">Gold</SelectItem>
                                    <SelectItem value="diamond">Diamond</SelectItem>
                                    <SelectItem value="platinum">Platinum</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Notes</Label>
                            <Input className="col-span-3" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => handleSave(false)}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">WhatsApp</Label>
                            <Input type="tel" className="col-span-3" value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount (₹)</Label>
                            <Input type="number" className="col-span-3" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Plan</Label>
                            <Select value={formData.membership_plan} onValueChange={e => setFormData({ ...formData, membership_plan: e })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bronze">Bronze</SelectItem>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="gold">Gold</SelectItem>
                                    <SelectItem value="diamond">Diamond</SelectItem>
                                    <SelectItem value="platinum">Platinum</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <Select value={(formData as any).status || "verified"} onValueChange={e => setFormData({ ...formData, status: e } as any)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Notes</Label>
                            <Input className="col-span-3" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => handleSave(true)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Course Progress Detail Dialog */}
            <Dialog open={!!selectedProgress} onOpenChange={(open) => !open && setSelectedProgress(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Course Progress Details</DialogTitle>
                        <DialogDescription>
                            Progress for {selectedProgress?.student}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {selectedProgress?.progress?.course_details?.length > 0 ? (
                            selectedProgress.progress.course_details.map((course: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <h4 className="font-medium text-sm text-slate-800 mb-1 line-clamp-2">{course.title}</h4>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                        <span>{course.completed_chapters} / {course.total_chapters} Chapters</span>
                                        <span className={course.percentage === 100 ? "text-green-600 font-bold" : "text-blue-600 font-semibold"}>
                                            {course.percentage}%
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${course.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${course.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                No specific course details available.
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedProgress(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REFUND DIALOG */}
            <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Refund
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to refund <b>₹{selectedTxn ? (Number(selectedTxn.amount) / 100).toLocaleString() : 0}</b> to {selectedTxn?.student_name || 'this user'}?
                            <br /><br />
                            This action cannot be undone. Funds will be returned to source via Razorpay.
                            <br /><br />
                            Type <b>refund</b> below to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={refundConfirmText}
                            onChange={e => setRefundConfirmText(e.target.value)}
                            placeholder="Type 'refund'"
                            className="border-red-300 focus:ring-red-500"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefund}
                            disabled={refundConfirmText.toLowerCase() !== 'refund' || isRefunding}
                        >
                            {isRefunding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Refund"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function UserIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    )
}
