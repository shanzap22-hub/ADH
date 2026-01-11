"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteUserActionProps {
    userId: string;
    userName: string;
}

export const DeleteUserAction = ({ userId, userName }: DeleteUserActionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (confirmText !== "DELETE") return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete user");
            }

            toast.success("User deleted successfully");
            setIsOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{userName}</strong>? This action cannot be undone.
                        This will delete the user account and all associated data.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        Type <strong>DELETE</strong> to confirm.
                    </p>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmText !== "DELETE" || loading}
                    >
                        {loading ? "Deleting..." : "Delete User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
