"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { deleteAccount } from "@/actions/delete-account";
import { createClient } from "@/lib/supabase/client";

export const DeleteAccountButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const router = useRouter();

    const handleDelete = async () => {
        try {
            setIsLoading(true);

            // 1. Delete on Server
            await deleteAccount();

            // 2. Clear Local Session (Important!)
            const supabase = createClient();
            await supabase.auth.signOut();

            toast.success("Account deleted successfully");

            // 3. Force Hard Redirect
            window.location.href = "/login";
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete account. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-500 mb-4">
                Permanently delete your account and all of your content. This action cannot be undone.
            </p>

            <AlertDialog onOpenChange={(open) => !open && setConfirmText("")}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Account?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you absolutely sure? This will explicitly delete your account and all your data from our servers.
                            This action cannot be undone.
                        </AlertDialogDescription>
                        <div className="pt-4">
                            <label className="text-sm text-slate-700 dark:text-slate-300 block mb-2">
                                To confirm, please type <span className="font-bold">delete</span> below:
                            </label>
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type delete"
                                className="w-full border-red-200 focus-visible:ring-red-500"
                            />
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isLoading || confirmText !== "delete"}
                        >
                            {isLoading ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
