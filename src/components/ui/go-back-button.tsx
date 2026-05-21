"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const GoBackButton = () => {
    const router = useRouter();
    return (
        <Button
            variant="ghost"
            className="pl-0 gap-2 w-fit hover:bg-transparent hover:text-orange-600 transition-colors h-auto py-1 -mt-2 md:-mt-4 mb-1"
            onClick={() => router.back()}
        >
            <ArrowLeft className="h-4 w-4" />
            Back
        </Button>
    );
};
