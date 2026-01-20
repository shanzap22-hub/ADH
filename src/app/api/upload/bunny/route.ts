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

        // 3. Prepare Bunny.net Config
        const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME;
        const ACCESS_KEY = process.env.BUNNY_STORAGE_API_KEY;
        const REGION = process.env.BUNNY_STORAGE_REGION || ""; // e.g., 'ny' or empty for DE
        const CDN_URL = process.env.BUNNY_CDN_HOSTNAME; // e.g. https://myzone.b-cdn.net

        if (!STORAGE_ZONE || !ACCESS_KEY) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Bunny Keys" }, { status: 500 });
        }

        // 4. Construct Filename (unique)
        // Folder: ai-uploads/{userId}/{timestamp}-{filename}
        const filename = `ai-uploads/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

        // 5. Upload to Bunny.net via fetch
        // Base URL depends on region. Default is storage.bunnycdn.com
        const baseUrl = REGION ? `https://${REGION}.storage.bunnycdn.com` : "https://storage.bunnycdn.com";
        const uploadUrl = `${baseUrl}/${STORAGE_ZONE}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": ACCESS_KEY,
                "Content-Type": "application/octet-stream",
            },
            body: Buffer.from(arrayBuffer),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Bunny Upload Failed:", errorText);
            throw new Error("Failed to upload to storage provider");
        }

        // 6. Return Public URL
        const publicUrl = `${CDN_URL}/${filename}`;

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
