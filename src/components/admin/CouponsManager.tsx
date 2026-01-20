"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Tag, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Changed from Switch
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CouponsManager() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "fixed",
        discount_value: "",
        usage_limit: "",
        expires_at: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    async function fetchCoupons() {
        try {
            const res = await fetch("/api/admin/coupons");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCoupons(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    }

    async function handlecreate() {
        if (!formData.code || !formData.discount_value) {
            toast.error("Code and Value are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Coupon Created");
            setIsAddOpen(false);
            setFormData({
                code: "",
                discount_type: "fixed",
                discount_value: "",
                usage_limit: "",
                expires_at: ""
            });
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function toggleActive(coupon: any) {
        // Optimistic update
        const newStatus = !coupon.active;
        setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, active: newStatus } : c));

        try {
            const res = await fetch("/api/admin/coupons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: coupon.id, active: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch (error) {
            toast.error("Failed to update status");
            fetchCoupons(); // Revert
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Coupon Deleted");
            setCoupons(coupons.filter(c => c.id !== id));
        } catch (error) {
            toast.error("Failed to delete");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Coupon Manager</h2>
                    <p className="text-muted-foreground">Create and manage discount codes.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-primary">
                    <Plus className="mr-2 h-4 w-4" /> Create Coupon
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No coupons found. Create one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <div className="font-bold text-lg text-primary">{coupon.code}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-base font-medium">
                                                {coupon.discount_type === 'fixed' ? '₹' : ''}{coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ''} OFF
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={coupon.active}
                                                    onCheckedChange={() => toggleActive(coupon)}
                                                />
                                                <span className="text-sm text-muted-foreground">{coupon.active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="font-semibold">{coupon.used_count}</span>
                                                <span className="text-muted-foreground"> / {coupon.usage_limit || '∞'} used</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {coupon.expires_at ? format(new Date(coupon.expires_at), "dd MMM yyyy") : "Never"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(coupon.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Coupon Code</Label>
                            <Input
                                placeholder="e.g. SUMMER50"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="uppercase"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select value={formData.discount_type} onValueChange={v => setFormData({ ...formData, discount_type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={formData.discount_value}
                                    onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Usage Limit (Optional)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={formData.usage_limit}
                                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expires At (Optional)</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handlecreate} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Coupon"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
