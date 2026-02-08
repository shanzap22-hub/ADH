
import { Metadata } from "next";
import { Suspense } from "react";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
    title: "Contact Us | ADH Connect",
    description: "Get in touch with the ADH CONNECT team regarding courses, support, or partnership inquiries.",
};

// 2026 Performance: 5-minute cache for contact form
export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen"></div>}>
            <ContactClient />
        </Suspense>
    );
}
