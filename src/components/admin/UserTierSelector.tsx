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
}

export function UserTierSelector({ userId, currentTier }: UserTierSelectorProps) {
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
                const tierNames: Record<string, string> = {
                    bronze: "Bronze",
                    silver: "Silver",
                    gold: "Gold",
                    diamond: "Diamond"
                };
                toast.success(`Tier updated to ${tierNames[newTier]}!`);
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
                <SelectItem value="bronze">🥉 Bronze (Free)</SelectItem>
                <SelectItem value="silver">🥈 Silver (₹4,999)</SelectItem>
                <SelectItem value="gold">🥇 Gold (₹9,999)</SelectItem>
                <SelectItem value="diamond">💎 Diamond (₹14,999)</SelectItem>
            </SelectContent>
        </Select>
    );
}
