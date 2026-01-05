"use server";

import { createHash } from "crypto";

interface BunnyUploadSignature {
    videoId: string;
    libraryId: string;
    authorizationSignature: string;
    authorizationExpire: string;
}

export async function getBunnyUploadSignature(fileName: string): Promise<BunnyUploadSignature> {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) {
        throw new Error("Bunny.net configuration missing");
    }

    // Create video in Bunny.net library
    const createVideoResponse = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
            method: "POST",
            headers: {
                "AccessKey": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: fileName,
            }),
        }
    );

    if (!createVideoResponse.ok) {
        const errorText = await createVideoResponse.text();
        console.error("[BUNNY_SIGNATURE] Failed to create video:", errorText);
        throw new Error("Failed to create video in Bunny.net");
    }

    const videoData = await createVideoResponse.json();
    const videoId = videoData.guid;

    // Generate authorization signature for TUS upload
    // Signature expires in 1 hour
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const authorizationExpire = expirationTime.toString();

    // Create signature: SHA256(library_id + api_key + expiration_time + video_id)
    const signatureString = `${libraryId}${apiKey}${authorizationExpire}${videoId}`;
    const authorizationSignature = createHash("sha256")
        .update(signatureString)
        .digest("hex");

    console.log("[BUNNY_SIGNATURE] Generated signature for video:", videoId);

    return {
        videoId,
        libraryId,
        authorizationSignature,
        authorizationExpire,
    };
}
