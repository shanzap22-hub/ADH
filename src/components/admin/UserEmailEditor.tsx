"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserEmailEditorProps {
    userId: string;
    currentEmail: string | null;
}

export const UserEmailEditor = ({ userId, currentEmail }: UserEmailEditorProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState(currentEmail || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/update-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update email");
            }

            toast.success("Email updated successfully");
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email..."
                    className="h-8 w-48"
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
            <div className="flex items-center gap-1 text-sm text-gray-500 min-w-[120px]">
                <Mail className="h-4 w-4" />
                <span>{currentEmail || "N/A"}</span>
            </div>
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
