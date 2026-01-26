"use server";

import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

// --- ATTACHMENTS & IMAGES (Storage) ---

export async function uploadToBunny(formData: FormData, folder: string): Promise<{ url?: string; error?: string }> {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    if (!process.env.BUNNY_STORAGE_API_KEY) {
        console.error("Bunny API Key Missing");
        return { error: "Storage configuration missing." };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}-${sanitizedName}`;
        const uploadPath = `${folder}/${fileName}`;

        let region = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();
        if (region === "singapore" || region === "asia") region = "sg";
        if (region === "stockholm" || region === "europe") region = "se";
        if (region === "germany") region = "de";

        let zoneName = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME || "";
        zoneName = zoneName.replace(".b-cdn.net", "").trim();

        if (!zoneName) return { error: "Storage Zone Name missing" };

        const hostname = region === 'de' ? 'storage.bunnycdn.com' : `${region}.storage.bunnycdn.com`;
        const endpoint = `https://${hostname}/${zoneName}/${uploadPath}`;
        const contentType = file.type || "application/octet-stream";

        const response = await fetch(endpoint, {
            method: "PUT",
            headers: {
                AccessKey: process.env.BUNNY_STORAGE_API_KEY,
                "Content-Type": contentType,
            },
            body: arrayBuffer,
        });

        if (!response.ok) {
            console.error(`Bunny Upload Error ${response.status}: ${await response.text()}`);
            return { error: "Upload to storage failed." };
        }

        const pullZoneDomain = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN || process.env.BUNNY_PULL_ZONE_DOMAIN || "adh-connect.b-cdn.net";

        if (pullZoneDomain) {
            return { url: `https://${pullZoneDomain}/${uploadPath}` };
        }

        return { url: `https://${hostname}/${zoneName}/${uploadPath}` };

    } catch (error: any) {
        console.error("Bunny Upload Exception:", error);
        return { error: "Upload failed: " + error.message };
    }
}

export async function getBunnyCredentials() {
    // Debug: Check Env Vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Server Env: Missing Supabase URL");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Server Env: Missing Supabase Key");

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.error("Bunny Credentials Auth Error:", error);
        throw new Error(`Unauthorized: ${error?.message || "No Identity Found"}`);
    }

    const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME || "";
    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const region = process.env.BUNNY_STORAGE_REGION || "sg";
    const pullZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN || process.env.BUNNY_PULL_ZONE_DOMAIN || "adh-connect.b-cdn.net";

    if (!apiKey || !zoneName) {
        throw new Error("Server Env: Missing Bunny Config");
    }

    return {
        zoneName: zoneName.replace(".b-cdn.net", "").trim(),
        apiKey,
        region,
        pullZone: pullZone.replace(/^https?:\/\//, '')
    };
}

// --- VIDEOS (Stream) ---

interface BunnyUploadSignature {
    videoId: string;
    libraryId: string;
    authorizationSignature: string;
    authorizationExpire: string;
}

export async function getBunnySignature(fileName: string, fileType: string): Promise<BunnyUploadSignature> {
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) throw new Error("Unauthorized");

    const libraryId = (process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID || "").trim();
    const apiKey = (process.env.BUNNY_API_KEY || "").trim(); // Stream API Key

    if (!libraryId) throw new Error("Missing BUNNY_LIBRARY_ID");
    if (!apiKey) throw new Error("Missing BUNNY_API_KEY");

    // Create video
    const createResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
        method: "POST",
        headers: { "AccessKey": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ title: fileName })
    });

    if (!createResponse.ok) {
        throw new Error("Failed to create video entry");
    }

    const videoData = await createResponse.json();
    const videoId = videoData.guid;

    // Generate Signature
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hr
    const signatureString = `${libraryId}${apiKey}${expirationTime}${videoId}`;
    const authorizationSignature = createHash("sha256").update(signatureString).digest("hex");

    return {
        videoId,
        libraryId,
        authorizationSignature,
        authorizationExpire: expirationTime.toString()
    };
}

export async function getBunnyVideoStatus(videoId: string) {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) throw new Error("Bunny Config Missing");

    const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
        method: "GET",
        headers: { "AccessKey": apiKey }
    });

    if (!response.ok) return { status: "error", message: `HTTP Error ${response.status}: ${response.statusText}` };

    const data = await response.json();
    if (data.status === 4 || data.encodeProgress === 100 || data.status === 3) {
        return { status: "ready" };
    }
    if (data.status === 2) return { status: "error", message: "Bunny Encoding Failed (Status 2)" };
    if (data.status === 5) return { status: "error", message: "Bunny Upload Revoked (Status 5)" };
    if (data.status === 6) return { status: "error", message: "Bunny Upload Cancelled (Status 6)" };

    return { status: "processing", progress: data.encodeProgress };
}

export async function getBunnyVideoLength(videoId: string, libraryId?: string): Promise<number> {
    const libId = libraryId || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libId || !apiKey) return 0;

    try {
        const response = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${videoId}`, {
            method: "GET",
            headers: { "AccessKey": apiKey }
        });

        if (!response.ok) return 0;

        const data = await response.json();
        return data.length || 0;
    } catch (e) {
        console.error("Error fetching video length", e);
        return 0;
    }
}
