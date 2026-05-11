import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * Bunny.net Signed Video URL Generator
 * 
 * Video piracy prevention: Client-ന് direct embed URL നൽകുന്നതിന് പകരം,
 * server-side ൽ time-limited signed URL generate ചെയ്യുന്നു.
 * 
 * Flow:
 * 1. User authenticated ആണോ check ചെയ്യുക
 * 2. User-ന് ആ video-ന്റെ course-ന് access ഉണ്ടോ check ചെയ്യുക (tier-based)
 * 3. SHA256 token generate ചെയ്ത് signed URL return ചെയ്യുക
 * 4. URL 6 മണിക്കൂർ കഴിഞ്ഞാൽ expire ആകും
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const videoId = searchParams.get("videoId");
        const courseId = searchParams.get("courseId");

        if (!videoId) {
            return NextResponse.json({ error: "Video ID required" }, { status: 400 });
        }

        // 1. Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Access check — user-ന്റെ tier-ന് course access ഉണ്ടോ?
        if (courseId) {
            const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // User profile fetch ചെയ്യുക
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("membership_tier, role")
                .eq("id", user.id)
                .single();

            // Admin/Instructor ആണെങ്കിൽ always allow
            const isPrivileged = profile?.role === "super_admin" || 
                                 profile?.role === "admin" || 
                                 profile?.role === "instructor";

            if (!isPrivileged) {
                // Tier-based access check
                const { data: tierAccess } = await supabaseAdmin
                    .from("course_tier_access")
                    .select("tier")
                    .eq("course_id", courseId)
                    .eq("tier", profile?.membership_tier || "free");

                // Direct purchase check
                const { data: purchase } = await supabaseAdmin
                    .from("purchases")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("course_id", courseId)
                    .maybeSingle();

                // Chapter free check
                const { data: freeChapter } = await supabaseAdmin
                    .from("chapters")
                    .select("id")
                    .eq("course_id", courseId)
                    .eq("is_free", true)
                    .limit(1);

                const hasTierAccess = tierAccess && tierAccess.length > 0;
                const hasPurchase = !!purchase;
                const hasFreeContent = freeChapter && freeChapter.length > 0;

                if (!hasTierAccess && !hasPurchase && !hasFreeContent) {
                    return NextResponse.json({ error: "Access denied" }, { status: 403 });
                }
            }
        }

        // 3. Signed URL generate ചെയ്യുക
        const securityKey = process.env.BUNNY_STREAM_TOKEN_KEY;
        const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

        if (!securityKey || !libraryId) {
            // Token key configure ചെയ്തിട്ടില്ലെങ്കിൽ unsigned URL return ചെയ്യുക (backward compatible)
            console.warn("[SIGNED_URL] BUNNY_STREAM_TOKEN_KEY not configured, returning unsigned URL");
            return NextResponse.json({
                url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true`,
                signed: false
            });
        }

        // 6 മണിക്കൂർ expiry (seconds)
        const expiresAt = Math.floor(Date.now() / 1000) + (6 * 60 * 60);

        // Bunny.net signing formula: SHA256(securityKey + videoId + expiresAt)
        const hashInput = securityKey + videoId + expiresAt;
        const token = crypto
            .createHash("sha256")
            .update(hashInput)
            .digest("hex");

        const signedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiresAt}&autoplay=false&preload=true`;

        return NextResponse.json({
            url: signedUrl,
            signed: true,
            expiresAt
        });

    } catch (error: any) {
        console.error("[SIGNED_URL] Error:", error);
        return NextResponse.json({ error: "Failed to generate video URL" }, { status: 500 });
    }
}
