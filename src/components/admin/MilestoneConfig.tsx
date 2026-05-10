"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateJourneyConfigAction } from "@/app/actions/journey";
import { ListPlus, Trash2, GripVertical, Settings2, Edit2, ArrowUp, ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneConfigProps {
    initialMilestones: string[];
}

export const MilestoneConfig = ({ initialMilestones }: MilestoneConfigProps) => {
    const [milestones, setMilestones] = useState<string[]>(initialMilestones);
    const [newMilestone, setNewMilestone] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAdd = () => {
        if (!newMilestone.trim()) return;
        if (milestones.includes(newMilestone.trim())) return toast.error("Already exists");
        setMilestones([...milestones, newMilestone.trim()]);
        setNewMilestone("");
    };

    const handleRemove = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newMilestones = [...milestones];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= milestones.length) return;
        
        [newMilestones[index], newMilestones[targetIndex]] = [newMilestones[targetIndex], newMilestones[index]];
        setMilestones(newMilestones);
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditingText(milestones[index]);
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        const newMilestones = [...milestones];
        newMilestones[editingIndex] = editingText.trim();
        setMilestones(newMilestones);
        setEditingIndex(null);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateJourneyConfigAction('milestones', milestones);
            if (result.success) {
                toast.success("Milestones updated successfully");
                setOpen(false);
                window.location.reload(); // Refresh to reflect changes
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update milestones");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 border-violet-200 text-violet-600 hover:bg-violet-50">
                    <Settings2 className="h-4 w-4" />
                    Configure Milestones
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-slate-200/60 dark:border-slate-800/60 max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black italic">Journey Milestones</DialogTitle>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Define the path to success</p>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex gap-2">
                        <Input 
                            value={newMilestone}
                            onChange={(e) => setNewMilestone(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Add new milestone..."
                            className="rounded-2xl h-12 border-slate-200 bg-slate-50"
                        />
                        <Button onClick={handleAdd} className="rounded-2xl bg-violet-600 h-12 w-12 p-0 shadow-lg shadow-violet-500/20">
                            <ListPlus className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        {milestones.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex flex-col gap-0.5">
                                        <button 
                                            onClick={() => handleMove(i, 'up')}
                                            disabled={i === 0}
                                            className="text-slate-300 hover:text-violet-500 disabled:opacity-30"
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button 
                                            onClick={() => handleMove(i, 'down')}
                                            disabled={i === milestones.length - 1}
                                            className="text-slate-300 hover:text-violet-500 disabled:opacity-30"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                    </div>
                                    {editingIndex === i ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Input 
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                className="h-8 py-0 rounded-lg text-sm border-violet-300 focus:ring-violet-500"
                                            />
                                            <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-emerald-500">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{m}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {editingIndex !== i && (
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-slate-400 hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => startEditing(i)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemove(i)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest italic">Level {milestones.length} Journey</p>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="w-full h-14 rounded-[1.5rem] bg-violet-600 hover:bg-violet-700 font-black shadow-xl shadow-violet-500/30 text-white gap-2"
                    >
                        {isLoading ? (
                            <>Updating...</>
                        ) : (
                            <>Save Journey Path</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
