
import { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
    title: "Forgot Password | ADH Connect",
    description: "Reset your ADH Connect password.",
};

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>}>
            <ForgotPasswordClient />
        </Suspense>
    );
}
