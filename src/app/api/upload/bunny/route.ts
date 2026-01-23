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

        // Validate File Size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
        }

        // 3. Prepare Bunny.net Config
        const STORAGE_ZONE = (process.env.BUNNY_STORAGE_ZONE_NAME || '').replace('.b-cdn.net', '').trim();
        const ACCESS_KEY = process.env.BUNNY_STORAGE_API_KEY;
        let REGION = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();

        // Normalize region codes
        if (REGION === "singapore" || REGION === "asia") REGION = "sg";
        if (REGION === "stockholm" || REGION === "europe") REGION = "se";
        if (REGION === "germany") REGION = "de";

        if (!STORAGE_ZONE || !ACCESS_KEY) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Bunny Keys" }, { status: 500 });
        }

        // 4. Construct Filename and Determine Content-Type
        const originalName = file.name;
        // Get extension from original name, default to .jpg if missing
        let ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
        if (ext === 'jpeg') ext = 'jpg';

        // Map common content types based on extension for reliability
        let contentType = file.type || "application/octet-stream";
        if (ext === 'png') contentType = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        if (ext === 'webp') contentType = 'image/webp';

        // 5. Determine Folder from Query Param
        const { searchParams } = new URL(req.url);
        let folder = searchParams.get('folder') || 'uploads';

        // Sanitize: allow only alphanumeric, dashes, underscores
        folder = folder.replace(/[^a-zA-Z0-9-_/]/g, '');

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 7);
        const filename = `${folder}/${timestamp}-${randomString}.${ext}`;

        // 5. Upload to Bunny.net
        const hostname = REGION === 'de' ? 'storage.bunnycdn.com' : `${REGION}.storage.bunnycdn.com`;
        const uploadUrl = `https://${hostname}/${STORAGE_ZONE}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": ACCESS_KEY,
                "Content-Type": contentType,
            },
            body: Buffer.from(arrayBuffer),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Bunny Upload Failed:", errorText);
            throw new Error(`Failed to upload: ${response.statusText}`);
        }

        // 6. Return Public CDN URL
        const pullZoneDomain = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN ||
            process.env.BUNNY_PULL_ZONE_DOMAIN ||
            "adh-connect.b-cdn.net";

        const publicUrl = `https://${pullZoneDomain}/${filename}`;

        return NextResponse.json({ url: publicUrl, type: contentType });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
