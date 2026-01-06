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
}

/**
 * Create video in Bunny.net and generate TUS upload signature
 * STEP 1: Create video object
 * STEP 2: Get videoId (guid)
 * STEP 3: Generate SHA256 signature
 */
export async function getBunnySignature(
    filename: string,
    filetype: string
): Promise<BunnySignature> {
    try {
        console.log("[BUNNY] Creating video object for:", filename);

        // STEP 1: Create video object in Bunny.net
        const createResponse = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
            {
                method: "POST",
                headers: {
                    "AccessKey": BUNNY_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: filename,
                }),
            }
        );

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("[BUNNY] Failed to create video:", errorText);
            throw new Error("Failed to create video in Bunny.net");
        }

        const videoData = await createResponse.json();

        // STEP 2: Get videoId (guid)
        const videoId = videoData.guid;
        console.log("[BUNNY] Video created with ID:", videoId);

        // STEP 3: Generate SHA256 signature
        // Formula: SHA256(libraryId + apiKey + expirationTime + videoId)
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const signatureString = `${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoId}`;

        const authorizationSignature = createHash("sha256")
            .update(signatureString)
            .digest("hex");

        console.log("[BUNNY] Generated signature for video:", videoId);

        return {
            videoId,
            libraryId: BUNNY_LIBRARY_ID,
            authorizationSignature,
            authorizationExpire: expirationTime,
        };
    } catch (error) {
        console.error("[BUNNY] Error in getBunnySignature:", error);
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
