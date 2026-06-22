"use client";

import { useState } from "react";
import { CourseTierManager } from "./CourseTierManager";
import { TierFeatureManager } from "./TierFeatureManager";
import { TierPricingEditor } from "./TierPricingEditor";
import { getTierInfo } from "@/lib/membership/utils";

interface CourseTiersDashboardProps {
    courses: any[];
    tierAssignments: any[];
    tierPricing: any[];
}

export function CourseTiersDashboard({
    courses,
    tierAssignments,
    tierPricing,
}: CourseTiersDashboardProps) {
    const [activeTab, setActiveTab] = useState("assignments");

    // Map tierPricing into standard format used by child managers
    const formattedTiers = tierPricing.map((tp) => {
        const info = getTierInfo(tp.tier);
        return {
            value: tp.tier,
            label: `${tp.name} ${info.icon}`,
            color: info.color,
            price: Number(tp.price),
            is_active: tp.is_active,
        };
    });

    return (
        <div className="space-y-6">
            {/* Tier Cards Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {tierPricing.map((tier) => {
                    const info = getTierInfo(tier.tier);
                    return (
                        <div
                            key={tier.tier}
                            className={`bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${
                                tier.is_active 
                                    ? "border-slate-200 dark:border-slate-800" 
                                    : "border-slate-100 dark:border-slate-900 opacity-60"
                            }`}
                        >
                            <div className="flex items-center gap-1">
                                <span className="text-lg">{info.icon}</span>
                                <div className={`text-sm font-bold truncate capitalize ${info.color}`}>
                                    {tier.name}
                                </div>
                            </div>
                            <div className="text-lg font-extrabold mt-1 text-slate-950 dark:text-slate-50">
                                {Number(tier.price) === 0 ? "Free" : `₹${Number(tier.price).toLocaleString("en-IN")}`}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate mt-1">
                                {!tier.is_active ? "⚠️ Inactive" : tier.has_booking_access ? "✨ Includes Booking" : "📚 Courses Only"}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab("assignments")}
                    className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 -mb-px ${
                        activeTab === "assignments"
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    Program Assignments
                </button>
                <button
                    onClick={() => setActiveTab("features")}
                    className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 -mb-px ${
                        activeTab === "features"
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    Feature Controls
                </button>
                <button
                    onClick={() => setActiveTab("pricing")}
                    className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 -mb-px ${
                        activeTab === "pricing"
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    Manage Tiers & Pricing
                </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4">
                {activeTab === "assignments" && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Program Tier Assignments</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            Check the boxes to allow students enrolled in specific membership tiers to access each Program.
                        </p>
                        <CourseTierManager
                            courses={courses}
                            tierAssignments={tierAssignments}
                            tiers={formattedTiers}
                        />
                    </div>
                )}

                {activeTab === "features" && (
                    <TierFeatureManager 
                        initialFeatures={tierPricing} 
                        tiers={formattedTiers}
                    />
                )}

                {activeTab === "pricing" && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <TierPricingEditor />
                    </div>
                )}
            </div>
        </div>
    );
}
