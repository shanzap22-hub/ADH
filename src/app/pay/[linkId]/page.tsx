import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkPayClient } from "@/components/payment/LinkPayClient";

interface PayPageProps {
    params: Promise<{ linkId: string }>;
}

export const dynamic = "force-dynamic";

export default async function PayLinkIdPage({ params }: PayPageProps) {
    const { linkId } = await params;

    // Validate UUID format to prevent Supabase database syntax error crashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(linkId)) {
        return notFound();
    }

    const supabase = await createClient();

    // Fetch the payment link details
    const { data: link, error: linkError } = await supabase
        .from("payment_links")
        .select("*")
        .eq("id", linkId)
        .eq("is_active", true)
        .single();

    if (linkError || !link) {
        return notFound();
    }

    const details = {
        title: link.title,
        description: link.description || "",
        imageUrl: null as string | null
    };

    // Load detailed data depending on type
    if (link.type === "course") {
        const { data: course } = await supabase
            .from("courses")
            .select("title, description, image_url")
            .eq("id", link.target_id)
            .single();

        if (course) {
            details.title = course.title;
            details.description = link.description || course.description || "";
            details.imageUrl = course.image_url;
        }
    } else if (link.type === "tier") {
        const { data: tier } = await supabase
            .from("tier_pricing")
            .select("name, description")
            .eq("tier", link.target_id)
            .single();

        if (tier) {
            details.title = `${tier.name} Membership Tier`;
            details.description = link.description || tier.description || "";
        }
    }

    return (
        <LinkPayClient
            link={{
                id: link.id,
                title: link.title,
                description: link.description,
                type: link.type,
                target_id: link.target_id,
                price: Number(link.price)
            }}
            details={details}
        />
    );
}
