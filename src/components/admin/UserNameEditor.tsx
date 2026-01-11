"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserNameEditorProps {
    userId: string;
    currentName: string | null;
}

export const UserNameEditor = ({ userId, currentName }: UserNameEditorProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentName || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/update-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, fullName: name }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update name");
            }

            toast.success("Name updated successfully");
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name..."
                    className="h-8 w-48 font-medium"
                    autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={loading}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {currentName || 'No name'}
            </h3>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
            >
                <Edit2 className="h-3 w-3" />
            </Button>
        </div>
    );
};
