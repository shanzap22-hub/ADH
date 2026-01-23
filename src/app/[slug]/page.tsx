import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function RedirectPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Try to find the redirect
    const { data: redirectData } = await supabase
        .from('redirects')
        .select('id, destination')
        .eq('slug', slug)
        .single();

    if (redirectData?.destination) {
        // Optional: Async Fire-and-forget click tracking logic here would go here
        // For performance, we just redirect immediately. 
        // You could use after() in Next 15 to update DB without blocking.

        return redirect(redirectData.destination);
    }

    // If no redirect found, Return 404
    return notFound();
}
