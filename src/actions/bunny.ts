"use server";

import { createHash } from "crypto";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
    throw new Error("Bunny.net environment variables not configured");
}

interface BunnySignature {
    videoId: string;
    libraryId: string;
    authorizationSignature: string;
    authorizationExpire: number;
    uploadUrl: string;
}

/**
 * Create video and generate upload signature for direct browser-to-Bunny upload
 * Returns signature that client uses to upload directly to Bunny.net
 */
export async function createBunnyVideoWithSignature(title: string): Promise<BunnySignature> {
    try {
        // Step 1: Create video entry in Bunny.net
        const createResponse = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
            {
                method: "POST",
                headers: {
                    "AccessKey": BUNNY_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title }),
            }
        );

        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error("[BUNNY] Create video failed:", error);
            throw new Error("Failed to create video in Bunny.net");
        }

        const videoData = await createResponse.json();
        const videoId = videoData.guid;

        // Step 2: Generate authorization signature for direct upload
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        // Signature: SHA256(library_id + api_key + expiration_time + video_id)
        const signatureString = `${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoId}`;
        const authorizationSignature = createHash("sha256")
            .update(signatureString)
            .digest("hex");

        const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;

        console.log("[BUNNY] Video created with signature:", videoId);

        return {
            videoId,
            libraryId: BUNNY_LIBRARY_ID,
            authorizationSignature,
            authorizationExpire: expirationTime,
            uploadUrl,
        };
    } catch (error) {
        console.error("[BUNNY] Error:", error);
        throw error;
    }
}

/**
 * Check video processing status
 */
export async function getBunnyVideoStatus(videoId: string) {
    try {
        const response = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
            {
                headers: {
                    "AccessKey": BUNNY_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch video status");
        }

        const data = await response.json();

        return {
            status: data.status === 4 ? "ready" : data.status === 3 ? "processing" : "failed",
            videoId: data.guid,
            thumbnail: data.thumbnailFileName,
        };
    } catch (error) {
        console.error("[BUNNY] Error checking status:", error);
        throw error;
    }
}
