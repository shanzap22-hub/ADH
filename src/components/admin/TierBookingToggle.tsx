"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch"; // Assuming switch exists or I'll implement simple input
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TierBookingToggleProps {
    tiers: any[];
}

export function TierBookingToggle({ tiers }: TierBookingToggleProps) {
    const router = useRouter();
    const [updating, setUpdating] = useState<string | null>(null);

    const onToggle = async (tierName: string, currentValue: boolean) => {
        setUpdating(tierName);
        try {
            const response = await fetch("/api/admin/tiers/update-feature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tierName,
                    feature: "has_booking_access",
                    value: !currentValue,
                }),
            });

            if (!response.ok) throw new Error("Failed to update");

            toast.success(`${tierName} booking access updated`);
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Feature Availability</h3>
            <div className="space-y-4">
                {tiers.map((tier) => (
                    <div key={tier.tier} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                            <div className="font-medium capitalize">{tier.name}</div>
                            <div className="text-sm text-slate-500">
                                {tier.has_booking_access ? "Can book 1-on-1 sessions" : "No booking access"}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Fallback to checkbox if Switch component missing in ui/switch */}
                            <input
                                type="checkbox"
                                checked={tier.has_booking_access || false}
                                onChange={() => onToggle(tier.tier, tier.has_booking_access)}
                                disabled={!!updating}
                                className="w-5 h-5 accent-purple-600 cursor-pointer"
                            />
                            {updating === tier.tier && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
