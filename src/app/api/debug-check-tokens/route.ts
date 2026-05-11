import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const crypto = await import("crypto");
        const securityKey = process.env.BUNNY_STREAM_TOKEN_KEY;
        const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
        const videoId = "b6d26e27-5c8b-4d01-a326-dc45d506222d";
        const expiresAt = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour

        let testUrl = null;
        let token = null;
        if (securityKey && libraryId) {
            const hashInput = securityKey + videoId + expiresAt;
            token = crypto.createHash("sha256").update(hashInput).digest("hex");
            testUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiresAt}`;
        }

        return NextResponse.json({
            status: "ok",
            hasUser: !!user,
            userEmail: user?.email,
            env: {
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasBunnyLibraryId: !!process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID,
                hasBunnyTokenKey: !!process.env.BUNNY_STREAM_TOKEN_KEY,
                bunnyLibraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
            },
            test: {
                videoId,
                expiresAt,
                token,
                testUrl
            }
        });
    } catch (err: any) {
        return NextResponse.json({ status: "error", message: err.message });
    }
}
