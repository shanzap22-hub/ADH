"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TierFeature {
    name: string;
    included: boolean;
}

interface TierComparisonProps {
    tiers: {
        name: string;
        tier: string;
        price: number;
        courseCount: number;
        features: string[];
        highlighted?: boolean;
    }[];
    onSelectTier?: (tier: string) => void;
}

export function TierComparisonTable({ tiers, onSelectTier }: TierComparisonProps) {
    const getTierIcon = (tier: string) => {
        switch (tier) {
            case "diamond":
                return "💎";
            case "gold":
                return "🥇";
            case "silver":
                return "🥈";
            case "bronze":
            default:
                return "🥉";
        }
    };

    const getTierGradient = (tier: string) => {
        switch (tier) {
            case "diamond":
                return "from-blue-500 to-purple-600";
            case "gold":
                return "from-yellow-400 to-orange-500";
            case "silver":
                return "from-gray-400 to-gray-600";
            case "bronze":
            default:
                return "from-orange-600 to-amber-700";
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tierData) => (
                <Card
                    key={tierData.tier}
                    className={`relative overflow-hidden ${tierData.highlighted
                            ? "border-2 border-orange-500 shadow-lg scale-105"
                            : "border"
                        }`}
                >
                    {tierData.highlighted && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            MOST POPULAR
                        </div>
                    )}

                    <div className="p-6 space-y-4">
                        {/* Tier Header */}
                        <div className="text-center">
                            <div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getTierGradient(
                                    tierData.tier
                                )} text-white font-bold mb-3`}
                            >
                                <span className="text-2xl">{getTierIcon(tierData.tier)}</span>
                                <span>{tierData.name}</span>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                {tierData.price === 0 ? (
                                    <div className="text-3xl font-bold">Free</div>
                                ) : (
                                    <div>
                                        <div className="text-3xl font-bold">
                                            ₹{tierData.price.toLocaleString("en-IN")}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            one-time payment
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Course Count */}
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {tierData.courseCount === 999
                                    ? "All Courses"
                                    : `${tierData.courseCount} Course${tierData.courseCount > 1 ? "s" : ""
                                    }`}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 pt-4 border-t">
                            {tierData.features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <Button
                            onClick={() => onSelectTier?.(tierData.tier)}
                            className={`w-full ${tierData.highlighted
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : "bg-slate-900 hover:bg-slate-800"
                                }`}
                            size="lg"
                        >
                            {tierData.price === 0 ? "Get Started" : "Upgrade Now"}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
