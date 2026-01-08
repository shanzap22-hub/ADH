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
import { getTierInfo } from "@/lib/membership/check-course-access";

interface UserTierSelectorProps {
    userId: string;
    currentTier: string;
}

const tiers = [
    { value: "bronze", label: "Bronze 🥉", price: "Free" },
    { value: "silver", label: "Silver 🥈", price: "₹4,999" },
    { value: "gold", label: "Gold 🥇", price: "₹9,999" },
    { value: "diamond", label: "Diamond 💎", price: "₹14,999" },
];

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
                const tierInfo = getTierInfo(newTier);
                toast.success(`Tier updated to ${tierInfo.name}!`, {
                    description: `User now has access to ${tierInfo.name} tier courses.`,
                });
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const currentTierInfo = getTierInfo(tier);

    return (
        <Select value={tier} onValueChange={handleTierChange} disabled={loading}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select tier">
                    <div className="flex items-center gap-2">
                        <span>{currentTierInfo.icon}</span>
                        <span>{currentTierInfo.name}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {tiers.map((tierOption) => {
                    const tierInfo = getTierInfo(tierOption.value);
                    return (
                        <SelectItem key={tierOption.value} value={tierOption.value}>
                            <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-2">
                                    <span>{tierInfo.icon}</span>
                                    <span className="font-medium">{tierInfo.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {tierOption.price}
                                </span>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
