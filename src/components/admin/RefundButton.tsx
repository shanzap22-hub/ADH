"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RefundButtonProps {
    paymentId: string;
    amount: number;
    isRefunded?: boolean;
}

export function RefundButton({ paymentId, amount, isRefunded }: RefundButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onRefund = async () => {
        if (!confirm("Are you sure you want to refund this transaction? This action cannot be undone.")) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/razorpay/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Refund failed");
            }

            toast.success("Refund processed successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isRefunded) {
        return <span className="text-red-600 font-medium text-sm">Refunded</span>;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onRefund}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    <RefreshCcw className="h-3 w-3 mr-1" />
                    Refund
                </>
            )}
        </Button>
    );
}
