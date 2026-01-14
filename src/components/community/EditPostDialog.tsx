"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Pin, Link as LinkIcon, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

const TIERS = [
    { value: "bronze", label: "Bronze" },
    { value: "silver", label: "Silver" },
    { value: "gold", label: "Gold" },
    { value: "diamond", label: "Diamond" },
];

interface EditPostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: any;
}

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
    const [content, setContent] = useState(post.content);
    const [link, setLink] = useState(post.link || "");
    const [isPinned, setIsPinned] = useState(post.is_pinned);

    // Initialize tiers set
    const initialTiers = new Set<string>(post.post_tier_access?.map((t: any) => t.tier) || []);
    const [selectedTiers, setSelectedTiers] = useState<Set<string>>(initialTiers);

    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(post.image_url);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const supabase = createClient();

    const toggleTier = (tier: string) => {
        const next = new Set(selectedTiers);
        if (next.has(tier)) {
            next.delete(tier);
        } else {
            next.add(tier);
        }
        setSelectedTiers(next);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview && imagePreview !== post.image_url) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUpdate = async () => {
        if (!content.trim()) return;

        setLoading(true);
        try {
            let imageUrl = post.image_url;

            // If image was removed
            if (!imagePreview) {
                imageUrl = null;
            }
            // If new image uploaded
            else if (imageFile) {
                const fileName = `${Date.now()}-${imageFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("feed_images")
                    .upload(fileName, imageFile);

                if (uploadError) throw new Error("Image upload failed");

                const { data: { publicUrl } } = supabase.storage
                    .from("feed_images")
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const res = await fetch("/api/feed/edit", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: post.id,
                    content,
                    link,
                    isPinned,
                    tiers: Array.from(selectedTiers),
                    imageUrl
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update");
            }

            toast.success("Post updated successfully!");
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="What's going on?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="resize-none min-h-[120px]"
                        />
                    </div>

                    {imagePreview && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={imagePreview} alt="Preview" className="max-h-[300px] w-full object-cover" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                onClick={removeImage}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2 text-slate-500"
                                    onClick={() => fileInputRef.current?.click()}
                                    type="button"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Image
                                </Button>
                            </div>

                            <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Add a link (optional)"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700">
                                <Checkbox
                                    id="edit-pin"
                                    checked={isPinned}
                                    onCheckedChange={(c) => setIsPinned(!!c)}
                                />
                                <Label htmlFor="edit-pin" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Pin
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Visible To</Label>
                            <div className="flex flex-wrap gap-2">
                                {TIERS.map(tier => (
                                    <div
                                        key={tier.value}
                                        className={`
                                            flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors
                                            ${selectedTiers.has(tier.value)
                                                ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                                            }
                                        `}
                                        onClick={() => toggleTier(tier.value)}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedTiers.has(tier.value) ? 'bg-purple-600' : 'bg-slate-300'}`} />
                                        <span className="text-xs font-medium">{tier.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading || !content} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
