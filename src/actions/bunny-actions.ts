"use server";

export async function uploadToBunny(formData: FormData, folder: string): Promise<{ url?: string; error?: string }> {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    // Debugging: Check if keys are loaded (Server Side)
    if (!process.env.BUNNY_STORAGE_API_KEY) {
        console.error("Bunny API Key Missing");
        return { error: "Storage configuration missing." };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();

        // Clean filename and ensure unique
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}-${sanitizedName}`;
        const uploadPath = `${folder}/${fileName}`; // e.g. feed_images/123-abc.jpg

        // Config
        let region = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();
        if (region === "singapore" || region === "asia") region = "sg";
        if (region === "stockholm" || region === "europe") region = "se";
        if (region === "germany") region = "de";

        let zoneName = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME || "";
        zoneName = zoneName.replace(".b-cdn.net", "").trim();

        if (!zoneName) return { error: "Storage Zone Name missing" };

        const hostname = region === 'de' ? 'storage.bunnycdn.com' : `${region}.storage.bunnycdn.com`;
        const endpoint = `https://${hostname}/${zoneName}/${uploadPath}`;

        // Content Type
        let contentType = "application/octet-stream";
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'pdf') contentType = 'application/pdf';
        else if (ext === 'mp4') contentType = 'video/mp4';

        // Upload
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

        // Return CDN URL
        const pullZoneDomain = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN || process.env.BUNNY_PULL_ZONE_DOMAIN || "adh-connect.b-cdn.net";

        if (pullZoneDomain) {
            return { url: `https://${pullZoneDomain}/${uploadPath}` };
        }

        // Fallback to storage URL if Pull Zone not set (not ideal for public config but works)
        return { url: `https://${hostname}/${zoneName}/${uploadPath}` };

    } catch (error: any) {
        console.error("Bunny Upload Exception:", error);
        return { error: "Upload failed: " + error.message };
    }
}
