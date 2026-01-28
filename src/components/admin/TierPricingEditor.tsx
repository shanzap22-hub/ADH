"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings, Save, RefreshCw } from "lucide-react";

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

            toast.success("Tier pricing updated successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save tier pricing");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Tier Pricing Settings</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Customize pricing and course limits for each tier
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers
                    .filter(t => !['expired', 'cancelled'].includes(t.tier))
                    .map((tier) => (
                        <div
                            key={tier.tier}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
                        >
                            {/* Tier Name */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold capitalize">{tier.name}</h3>
                                <Checkbox
                                    checked={tier.is_active}
                                    onCheckedChange={(checked) =>
                                        updateTier(tier.tier, 'is_active', checked)
                                    }
                                />
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor={`price-${tier.tier}`}>
                                    Price (₹)
                                </Label>
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

                            {/* Max Courses - HIDDEN / DEPRECATED per update
                            <div className="space-y-2">
                                <Label htmlFor={`max-${tier.tier}`}>
                                    Max Courses
                                </Label>
                                <Input
                                    id={`max-${tier.tier}`}
                                    type="number"
                                    value={tier.max_courses}
                                    onChange={(e) =>
                                        updateTier(tier.tier, 'max_courses', parseInt(e.target.value) || 0)
                                    }
                                    min="0"
                                    step="1"
                                />
                                <p className="text-xs text-slate-500">
                                    Use 999 for unlimited access
                                </p>
                            </div>
                            */}

                            {/* Booking Access */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`booking-${tier.tier}`}
                                    checked={tier.has_booking_access}
                                    onCheckedChange={(checked) =>
                                        updateTier(tier.tier, 'has_booking_access', checked)
                                    }
                                />
                                <Label
                                    htmlFor={`booking-${tier.tier}`}
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    1-on-1 Booking Access
                                </Label>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor={`desc-${tier.tier}`}>
                                    Description
                                </Label>
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
                    ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Admin Control
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Set any price for any tier</li>
                    <li>• Bronze can have 10,000 courses, Diamond can have 1 course</li>
                    <li>• Completely flexible - no pre-set rules</li>
                    <li>• Changes apply immediately after saving</li>
                </ul>
            </div>
        </div>
    );
}
