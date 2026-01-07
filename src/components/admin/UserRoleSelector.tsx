"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UserRoleSelectorProps {
    userId: string;
    currentRole: string;
}

export function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
    const [role, setRole] = useState(currentRole);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRoleChange = async (newRole: string) => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) {
                toast.error("Failed to update role", { description: error.message });
            } else {
                setRole(newRole);
                toast.success("Role updated successfully!");
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select value={role} onValueChange={handleRoleChange} disabled={loading}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
        </Select>
    );
}
