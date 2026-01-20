import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Prepare Bunny.net Config (matching bunny-actions.ts)
        const STORAGE_ZONE = (process.env.BUNNY_STORAGE_ZONE_NAME || '').replace('.b-cdn.net', '').trim();
        const ACCESS_KEY = process.env.BUNNY_STORAGE_API_KEY;
        let REGION = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();

        // Normalize region codes (same as bunny-actions)
        if (REGION === "singapore" || REGION === "asia") REGION = "sg";
        if (REGION === "stockholm" || REGION === "europe") REGION = "se";
        if (REGION === "germany") REGION = "de";

        if (!STORAGE_ZONE || !ACCESS_KEY) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Bunny Keys" }, { status: 500 });
        }

        // 4. Construct Filename (unique)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `chat_images/${Date.now()}-${sanitizedName}`;

        // 5. Upload to Bunny.net
        const hostname = REGION === 'de' ? 'storage.bunnycdn.com' : `${REGION}.storage.bunnycdn.com`;
        const uploadUrl = `https://${hostname}/${STORAGE_ZONE}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": ACCESS_KEY,
                "Content-Type": file.type || "application/octet-stream",
            },
            body: Buffer.from(arrayBuffer),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Bunny Upload Failed:", errorText);
            throw new Error("Failed to upload to storage provider");
        }

        // 6. Return Public CDN URL (using Pull Zone Domain)
        const pullZoneDomain = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN ||
            process.env.BUNNY_PULL_ZONE_DOMAIN ||
            "adh-connect.b-cdn.net";

        const publicUrl = `https://${pullZoneDomain}/${filename}`;

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
