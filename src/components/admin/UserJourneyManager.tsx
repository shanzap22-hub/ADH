"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminUpdateUserJourneyAction } from "@/app/actions/journey";

interface UserJourneyManagerProps {
    userId: string;
    userName: string;
    currentRevenue: number;
    currentTarget: number;
    currentMilestone: string;
    availableMilestones: string[];
}

export const UserJourneyManager = ({ 
    userId, 
    userName, 
    currentRevenue, 
    currentTarget,
    currentMilestone,
    availableMilestones
}: UserJourneyManagerProps) => {
    const [revenue, setRevenue] = useState(currentRevenue);
    const [target, setTarget]   = useState(currentTarget);
    const [milestone, setMilestone] = useState(currentMilestone);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const result = await adminUpdateUserJourneyAction(
                userId,
                milestone,
                revenue,
                target
            );
            
            if (result.success) {
                toast.success(`Updated journey for ${userName}`);
                setOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update journey");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl font-bold border-violet-200 hover:bg-violet-50 text-violet-600">
                    Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Manage Journey: {userName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Milestone</label>
                        <Select value={milestone} onValueChange={setMilestone}>
                            <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder="Select Milestone" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {availableMilestones.map(m => (
                                    <SelectItem key={m} value={m} className="rounded-xl">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Revenue (₹)</label>
                            <Input 
                                type="number" 
                                value={revenue} 
                                onChange={(e) => setRevenue(Number(e.target.value))}
                                className="rounded-2xl h-12 border-slate-200 dark:border-slate-800 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Target (₹)</label>
                            <Input 
                                type="number" 
                                value={target} 
                                onChange={(e) => setTarget(Number(e.target.value))}
                                className="rounded-2xl h-12 border-slate-200 dark:border-slate-800 font-bold"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleUpdate} 
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 font-black shadow-lg shadow-violet-500/20"
                    >
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
