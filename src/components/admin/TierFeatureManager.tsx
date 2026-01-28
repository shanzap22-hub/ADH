// @ts-nocheck
"use client";

import { useState } from "react";
import { MessageCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TierFeature {
    tier: string;
    has_community_feed_access: boolean;
    has_community_chat_access: boolean;
    has_ai_access: boolean;
    has_weekly_live_access?: boolean;
    has_booking_access?: boolean;
}

interface TierFeatureManagerProps {
    initialFeatures: TierFeature[];
}

const TIERS = [
    { value: "bronze", label: "Bronze 🥉", color: "text-orange-700" },
    { value: "silver", label: "Silver 🥈", color: "text-gray-600" },
    { value: "gold", label: "Gold 🥇", color: "text-yellow-600" },
    { value: "platinum", label: "Platinum 💠", color: "text-indigo-600" },
    { value: "diamond", label: "Diamond 💎", color: "text-blue-600" },
    { value: "expired", label: "Expired ⚠️", color: "text-red-600" },
];

export function TierFeatureManager({ initialFeatures }: TierFeatureManagerProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    // Initialize with default true if missing (for seamless UI before DB update propagates)
    const [features, setFeatures] = useState<TierFeature[]>(initialFeatures.map(f => ({
        ...f,
        has_weekly_live_access: f.has_weekly_live_access ?? true,
        has_booking_access: f.has_booking_access ?? true
    })));

    const toggleFeature = (tierValue: string, featureKey: keyof Omit<TierFeature, 'tier'>) => {
        setFeatures(prev => {
            return prev.map(f => {
                if (f.tier === tierValue) {
                    return { ...f, [featureKey]: !f[featureKey] };
                }
                return f;
            });
        });
    };

    const getFeature = (tierValue: string) => {
        return features.find(f => f.tier === tierValue) || {
            tier: tierValue,
            has_community_feed_access: false,
            has_community_chat_access: false,
            has_ai_access: false,
            has_weekly_live_access: false,
            has_booking_access: false
        };
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/tier-features", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Tier features updated successfully!");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update tier features");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    Tier Feature Control
                </CardTitle>
                <CardDescription>
                    Control access to Community Feed, Community Chat, AI Mentor, Weekly Live, and Booking for each tier.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {TIERS.map((tier) => {
                            const feature = getFeature(tier.value);
                            return (
                                <div key={tier.value} className="flex flex-col p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <span className={`font-semibold mb-3 text-center ${tier.color}`}>{tier.label}</span>

                                    <div className="space-y-3">
                                        {/* Community Feed Access */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`feed-${tier.value}`}
                                                checked={feature.has_community_feed_access}
                                                onCheckedChange={() => toggleFeature(tier.value, 'has_community_feed_access')}
                                            />
                                            <label htmlFor={`feed-${tier.value}`} className="text-sm cursor-pointer select-none">
                                                Community Feed
                                            </label>
                                        </div>

                                        {/* Community Chat Access */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`chat-${tier.value}`}
                                                checked={feature.has_community_chat_access}
                                                onCheckedChange={() => toggleFeature(tier.value, 'has_community_chat_access')}
                                            />
                                            <label htmlFor={`chat-${tier.value}`} className="text-sm cursor-pointer select-none">
                                                Community Chat
                                            </label>
                                        </div>

                                        {/* AI Mentor Access */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`ai-${tier.value}`}
                                                checked={feature.has_ai_access}
                                                onCheckedChange={() => toggleFeature(tier.value, 'has_ai_access')}
                                            />
                                            <label htmlFor={`ai-${tier.value}`} className="text-sm cursor-pointer select-none">
                                                AI Mentor
                                            </label>
                                        </div>

                                        {/* Weekly Live */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`live-${tier.value}`}
                                                checked={feature.has_weekly_live_access}
                                                onCheckedChange={() => toggleFeature(tier.value, 'has_weekly_live_access')}
                                            />
                                            <label htmlFor={`live-${tier.value}`} className="text-sm cursor-pointer select-none">
                                                Weekly Live
                                            </label>
                                        </div>

                                        {/* Booking Access */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`booking-${tier.value}`}
                                                checked={feature.has_booking_access}
                                                onCheckedChange={() => toggleFeature(tier.value, 'has_booking_access')}
                                            />
                                            <label htmlFor={`booking-${tier.value}`} className="text-sm cursor-pointer select-none">
                                                Booking Access
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
