"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings, Save, RefreshCw, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TierPricing {
    tier: string;
    name: string;
    price: number;
    max_courses: number;
    has_booking_access: boolean;
    is_active: boolean;
    description: string | null;
}

export function TierPricingEditor() {
    const router = useRouter();
    const [tiers, setTiers] = useState<TierPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Add New Tier Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSlug, setNewSlug] = useState("");
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("0");
    const [newDescription, setNewDescription] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            const response = await fetch("/api/admin/tier-pricing");
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setTiers(data);
        } catch (error) {
            toast.error("Failed to load tier pricing");
        } finally {
            setLoading(false);
        }
    };

    const updateTier = (tier: string, field: keyof TierPricing, value: any) => {
        setTiers(prev => prev.map(t =>
            t.tier === tier ? { ...t, [field]: value } : t
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/tier-pricing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tiers }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Tier configurations saved successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save tier pricing");
        } finally {
            setSaving(false);
        }
    };

    const handleAddTier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlug || !newName) {
            toast.error("Please fill in Tier Slug and Display Name");
            return;
        }

        const slugPattern = /^[a-z0-9_-]+$/;
        if (!slugPattern.test(newSlug)) {
            toast.error("Tier slug must contain only lowercase letters, numbers, hyphens or underscores");
            return;
        }

        // Check if slug already exists
        if (tiers.some(t => t.tier === newSlug.toLowerCase().trim())) {
            toast.error("A tier with this slug already exists");
            return;
        }

        setAdding(true);
        try {
            const response = await fetch("/api/admin/tier-pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tier: newSlug.toLowerCase().trim(),
                    name: newName,
                    price: parseFloat(newPrice) || 0,
                    description: newDescription || null
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to add tier");
            }

            toast.success(`Tier "${newName}" created successfully!`);
            setShowAddForm(false);
            setNewSlug("");
            setNewName("");
            setNewPrice("0");
            setNewDescription("");
            await fetchTiers();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to add tier");
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteTier = async (tierSlug: string) => {
        if (!confirm(`Are you sure you want to delete the "${tierSlug}" tier? This will affect any users assigned to it.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/tier-pricing?tier=${tierSlug}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to delete tier");
            }

            toast.success("Tier deleted successfully!");
            await fetchTiers();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete tier");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // Core tiers that cannot be deleted
    const coreTiers = ["free", "expired", "cancelled", "bronze", "silver", "gold", "diamond", "platinum"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Tier Pricing Settings</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Customize names, pricing, and settings for each membership tier
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="border-slate-200 dark:border-slate-800"
                    >
                        {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {showAddForm ? "Cancel" : "Add New Tier"}
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Add New Tier Form (Expandable) */}
            {showAddForm && (
                <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10">
                    <CardHeader>
                        <CardTitle className="text-lg">Create New Membership Tier</CardTitle>
                        <CardDescription>Define a new membership tier. Once created, you can assign programs and toggles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddTier} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="new-slug">Tier Slug (Unique ID)</Label>
                                <Input
                                    id="new-slug"
                                    placeholder="e.g. emerald"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-name">Display Name</Label>
                                <Input
                                    id="new-name"
                                    placeholder="e.g. Emerald VIP"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-price">Price (₹)</Label>
                                <Input
                                    id="new-price"
                                    type="number"
                                    min="0"
                                    placeholder="19999"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-desc">Description</Label>
                                <Input
                                    id="new-desc"
                                    placeholder="Tier descriptions"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                                <Button type="submit" disabled={adding} className="bg-purple-600 hover:bg-purple-700">
                                    {adding ? "Creating..." : "Create Tier"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Tier Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers
                    .filter(t => !['expired', 'cancelled'].includes(t.tier))
                    .map((tier) => (
                        <div
                            key={tier.tier}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Tier Slug Label */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        ID: {tier.tier}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`active-${tier.tier}`} className="text-xs text-slate-500 cursor-pointer">
                                            Active
                                        </Label>
                                        <Checkbox
                                            id={`active-${tier.tier}`}
                                            checked={tier.is_active}
                                            onCheckedChange={(checked) =>
                                                updateTier(tier.tier, 'is_active', checked)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Tier Name (Editable) */}
                                <div className="space-y-2">
                                    <Label htmlFor={`name-${tier.tier}`}>Display Name</Label>
                                    <Input
                                        id={`name-${tier.tier}`}
                                        value={tier.name}
                                        onChange={(e) =>
                                            updateTier(tier.tier, 'name', e.target.value)
                                        }
                                        className="font-bold"
                                        placeholder="Display Name"
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor={`price-${tier.tier}`}>Price (₹)</Label>
                                    <Input
                                        id={`price-${tier.tier}`}
                                        type="number"
                                        value={tier.price}
                                        onChange={(e) =>
                                            updateTier(tier.tier, 'price', parseFloat(e.target.value) || 0)
                                        }
                                        min="0"
                                        step="1"
                                    />
                                </div>

                                {/* Booking Access */}
                                <div className="flex items-center space-x-2 pt-1">
                                    <Checkbox
                                        id={`booking-${tier.tier}`}
                                        checked={tier.has_booking_access}
                                        onCheckedChange={(checked) =>
                                            updateTier(tier.tier, 'has_booking_access', checked)
                                        }
                                    />
                                    <Label
                                        htmlFor={`booking-${tier.tier}`}
                                        className="text-sm font-normal cursor-pointer select-none"
                                    >
                                        Include 1-on-1 Booking Access
                                    </Label>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor={`desc-${tier.tier}`}>Description</Label>
                                    <Input
                                        id={`desc-${tier.tier}`}
                                        value={tier.description || ''}
                                        onChange={(e) =>
                                            updateTier(tier.tier, 'description', e.target.value)
                                        }
                                        placeholder="Tier description"
                                    />
                                </div>
                            </div>

                            {/* Delete Action for Custom Tiers */}
                            {!coreTiers.includes(tier.tier) && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteTier(tier.tier)}
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Custom Tier
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Admin Controls
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Edit display names of tiers to instantly update across all badges and forms</li>
                    <li>• Add new tiers dynamically; they will appear in Assignments and Feature panels automatically</li>
                    <li>• Core system tiers (Bronze, Silver, Gold, etc.) cannot be deleted to ensure platform stability</li>
                </ul>
            </div>
        </div>
    );
}
