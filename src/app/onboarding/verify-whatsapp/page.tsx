import VerifyWhatsappClient from "./VerifyWhatsappClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function VerifyWhatsappPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
            <VerifyWhatsappClient />
        </Suspense>
    );
}
