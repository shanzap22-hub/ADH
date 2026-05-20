"use client";

import { useState, useMemo } from "react";
import { Link2, Copy, Check, Trash2, ShieldAlert, Plus, Power, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Course {
    id: string;
    title: string;
    price: number | null;
}

interface TierPricing {
    tier: string;
    name: string;
    price: number;
}

interface PaymentLink {
    id: string;
    title: string;
    description: string | null;
    type: string;
    target_id: string;
    price: number;
    is_active: boolean;
    created_at: string;
}

interface PaymentLinksManagerProps {
    courses: Course[];
    tierPricing: TierPricing[];
    initialLinks: PaymentLink[];
}

export function PaymentLinksManager({ courses, tierPricing, initialLinks }: PaymentLinksManagerProps) {
    const router = useRouter();
    const supabase = createClient();

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"tier" | "course">("tier");
    const [targetId, setTargetId] = useState("");
    const [price, setPrice] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filtered options based on selected type
    const targetOptions = useMemo(() => {
        if (type === "tier") {
            return tierPricing.map(t => ({ id: t.tier, name: `${t.name} (₹${t.price})`, defaultPrice: t.price }));
        } else {
            return courses.map(c => ({ id: c.id, name: `${c.title} (₹${c.price || 0})`, defaultPrice: c.price || 0 }));
        }
    }, [type, courses, tierPricing]);

    // Handle Type Change
    const handleTypeChange = (val: "tier" | "course") => {
        setType(val);
        setTargetId("");
        setPrice("");
    };

    // Handle Target Change (Auto-fill price and generate simple title if empty)
    const handleTargetChange = (val: string) => {
        setTargetId(val);
        const selected = targetOptions.find(o => o.id === val);
        if (selected) {
            setPrice(selected.defaultPrice.toString());
            if (!title) {
                setTitle(`Link for ${selected.name.split(" (")[0]}`);
            }
        }
    };

    // Create Link
    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !type || !targetId || !price) {
            toast.error("Please fill in all required fields");
            return;
        }

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Please enter a valid price");
            return;
        }

        setCreating(true);
        try {
            const { error } = await supabase
                .from("payment_links")
                .insert([
                    {
                        title,
                        description: description || null,
                        type,
                        target_id: targetId,
                        price: numericPrice,
                        is_active: isActive
                    }
                ]);

            if (error) throw error;

            toast.success("Payment link generated successfully!");
            // Reset form
            setTitle("");
            setDescription("");
            setTargetId("");
            setPrice("");
            setIsActive(true);
            router.refresh();
        } catch (err: any) {
            console.error("Error creating payment link:", err);
            toast.error(err.message || "Failed to create payment link");
        } finally {
            setCreating(false);
        }
    };

    // Toggle Active Status
    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("payment_links")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;

            toast.success(`Payment link ${!currentStatus ? "activated" : "deactivated"} successfully`);
            router.refresh();
        } catch (err: any) {
            console.error("Error updating payment link status:", err);
            toast.error("Failed to update status");
        }
    };

    // Delete Link
    const handleDeleteLink = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment link?")) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from("payment_links")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Payment link deleted successfully");
            router.refresh();
        } catch (err: any) {
            console.error("Error deleting payment link:", err);
            toast.error("Failed to delete link");
        } finally {
            setDeletingId(null);
        }
    };

    // Copy Link to Clipboard
    const handleCopyLink = (id: string) => {
        const url = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success("Payment link copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Helpers
    const getTargetName = (linkType: string, id: string) => {
        if (linkType === "tier") {
            return tierPricing.find(t => t.tier === id)?.name || id;
        } else {
            return courses.find(c => c.id === id)?.title || "Unknown Program";
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Card */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Plus className="h-5 w-5 text-purple-600" />
                            Create Payment Link
                        </CardTitle>
                        <CardDescription>
                            Generate a customized payment checkout link for a Program or Membership Tier.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateLink} className="space-y-4">
                            {/* Type Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="link-type" className="font-semibold">Type</Label>
                                <Select value={type} onValueChange={(val: "tier" | "course") => handleTypeChange(val)}>
                                    <SelectTrigger id="link-type" className="rounded-xl border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="tier">Membership Tier</SelectItem>
                                        <SelectItem value="course">Program (Course)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Target Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="link-target" className="font-semibold">Target {type === "tier" ? "Tier" : "Program"}</Label>
                                <Select value={targetId} onValueChange={handleTargetChange}>
                                    <SelectTrigger id="link-target" className="rounded-xl border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder={`Select a ${type === "tier" ? "Tier" : "Program"}`} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {targetOptions.map(opt => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor="link-price" className="font-semibold">Custom Price (₹)</Label>
                                <Input
                                    id="link-price"
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Enter amount (INR)"
                                    required
                                    className="rounded-xl border-slate-200 dark:border-slate-800"
                                />
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="link-title" className="font-semibold">Link Title / Label</Label>
                                <Input
                                    id="link-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Special Discount Link"
                                    required
                                    className="rounded-xl border-slate-200 dark:border-slate-800"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="link-desc" className="font-semibold">Description (Optional)</Label>
                                <Textarea
                                    id="link-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the offer/link features"
                                    className="rounded-xl border-slate-200 dark:border-slate-800 resize-none h-20"
                                />
                            </div>

                            {/* Is Active Switch */}
                            <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5">
                                    <Label htmlFor="link-active" className="font-semibold">Active Status</Label>
                                    <p className="text-xs text-muted-foreground">Make this link immediately available for use</p>
                                </div>
                                <Switch
                                    id="link-active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={creating}
                                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold transition shadow-sm text-white"
                            >
                                {creating ? "Generating..." : "Generate Link"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Table Card */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Link2 className="h-5 w-5 text-indigo-500" />
                            Active Payment Links
                        </CardTitle>
                        <CardDescription>
                            Below are the custom payment links generated for manual distributions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6 md:pt-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Label / Target</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialLinks.map((link) => (
                                        <TableRow key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <TableCell>
                                                <div className="font-semibold text-sm max-w-[200px] truncate" title={link.title}>
                                                    {link.title}
                                                </div>
                                                <div className="text-xs text-slate-500 max-w-[200px] truncate" title={getTargetName(link.type, link.target_id)}>
                                                    {getTargetName(link.type, link.target_id)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                                ₹{link.price.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={link.type === "tier" ? "default" : "secondary"} className="capitalize">
                                                    {link.type === "tier" ? "Tier Plan" : "Program"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <button
                                                    onClick={() => handleToggleActive(link.id, link.is_active)}
                                                    className="inline-flex focus:outline-none"
                                                    title={`Click to ${link.is_active ? "Deactivate" : "Activate"}`}
                                                >
                                                    <Badge variant={link.is_active ? "success" as any : "destructive"} className="gap-1 cursor-pointer">
                                                        <Power className="h-3 w-3" />
                                                        {link.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Copy Link Button */}
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                                        onClick={() => handleCopyLink(link.id)}
                                                        title="Copy Payment URL"
                                                    >
                                                        {copiedId === link.id ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                                                        )}
                                                    </Button>

                                                    {/* Open link button */}
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                                        onClick={() => window.open(`/pay/${link.id}`, "_blank")}
                                                        title="Test Payment Page"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                                                    </Button>

                                                    {/* Delete Button */}
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        disabled={deletingId === link.id}
                                                        className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                        onClick={() => handleDeleteLink(link.id)}
                                                        title="Delete Payment Link"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {initialLinks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <ShieldAlert className="h-8 w-8 opacity-20" />
                                                    <p>No active payment links found. Generate one on the left.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
