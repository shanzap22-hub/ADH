"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UserTierSelectorProps {
    userId: string;
    currentTier: string;
    tiers: { tier: string; name: string }[];
}

export function UserTierSelector({ userId, currentTier, tiers }: UserTierSelectorProps) {
    const [tier, setTier] = useState(currentTier || "bronze");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleTierChange = async (newTier: string) => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ membership_tier: newTier, updated_at: new Date().toISOString() })
                .eq("id", userId);

            if (error) {
                toast.error("Failed to update tier", { description: error.message });
            } else {
                setTier(newTier);
                const displayName = tiers.find(t => t.tier === newTier)?.name || newTier;
                toast.success(`Tier updated to ${displayName}!`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select value={tier} onValueChange={handleTierChange} disabled={loading}>
            <SelectTrigger className="w-[180px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {tiers.map((t) => {
                    const info = getTierInfo(t.tier);
                    return (
                        <SelectItem key={t.tier} value={t.tier}>
                            {info.icon} {t.name}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}

// Helper to get local icon mapping
function getTierInfo(tier: string) {
    const t = tier.toLowerCase();
    if (t === "bronze") return { icon: "🥉" };
    if (t === "silver") return { icon: "🥈" };
    if (t === "gold") return { icon: "🥇" };
    if (t === "diamond") return { icon: "💎" };
    if (t === "platinum") return { icon: "💍" };
    if (t === "expired") return { icon: "⚠️" };
    if (t === "cancelled") return { icon: "🚫" };
    return { icon: "✨" };
}
