"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Course {
    id: string;
    title: string;
    description: string | null;
    is_published: boolean;
}

interface TierAssignment {
    course_id: string;
    tier: string;
}

interface CourseTierManagerProps {
    courses: Course[];
    tierAssignments: TierAssignment[];
}

const TIERS = [
    { value: "bronze", label: "Bronze 🥉", color: "text-orange-700" },
    { value: "silver", label: "Silver 🥈", color: "text-gray-600" },
    { value: "gold", label: "Gold 🥇", color: "text-yellow-600" },
    { value: "diamond", label: "Diamond 💎", color: "text-blue-600" },
];

export function CourseTierManager({ courses, tierAssignments }: CourseTierManagerProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Create a map of course_id -> Set of tiers
    const initialAssignments = new Map<string, Set<string>>();
    tierAssignments.forEach((assignment) => {
        if (!initialAssignments.has(assignment.course_id)) {
            initialAssignments.set(assignment.course_id, new Set());
        }
        initialAssignments.get(assignment.course_id)!.add(assignment.tier);
    });

    const [assignments, setAssignments] = useState(initialAssignments);

    const toggleTier = (courseId: string, tier: string) => {
        setAssignments((prev) => {
            const newAssignments = new Map(prev);
            const currentTiers = newAssignments.get(courseId);
            const newTiers = new Set(currentTiers); // correct cloning

            if (newTiers.has(tier)) {
                newTiers.delete(tier);
            } else {
                newTiers.add(tier);
            }
            newAssignments.set(courseId, newTiers);
            return newAssignments;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/course-tiers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignments: Array.from(assignments.entries()).map(([courseId, tiers]) => ({
                        courseId,
                        tiers: Array.from(tiers),
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save tier assignments");
            }

            toast.success("Tier assignments saved successfully!");
            router.refresh();
        } catch (error) {
            console.error("Error saving tier assignments:", error);
            toast.error("Failed to save tier assignments");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Course
                                </th>
                                {TIERS.map((tier) => (
                                    <th
                                        key={tier.value}
                                        className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                                    >
                                        {tier.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {courses.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                {course.title}
                                            </div>
                                            {course.description && (
                                                <div className="text-sm text-slate-500 line-clamp-1">
                                                    {course.description}
                                                </div>
                                            )}
                                            {!course.is_published && (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {TIERS.map((tier) => (
                                        <td key={tier.value} className="px-6 py-4 text-center">
                                            <Checkbox
                                                checked={assignments.get(course.id)?.has(tier.value) || false}
                                                onCheckedChange={() => toggleTier(course.id, tier.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="bg-purple-600 hover:bg-purple-700">
                    {saving ? "Saving..." : "Save Tier Assignments"}
                </Button>
            </div>

            {/* Info Removed */}
        </div>
    );
}
