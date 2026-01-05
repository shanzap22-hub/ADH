"use server";

/**
 * Bunny.net Video Upload Server Actions
 * Handles video creation and upload using server-side API authentication
 */

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
    throw new Error("Bunny.net environment variables not configured");
}

interface CreateVideoResponse {
    guid: string;
    libraryId: string;
    videoLibraryId: number;
}

interface UploadUrlResponse {
    videoId: string;
    uploadUrl: string;
}

/**
 * Create a new video in Bunny.net library
 * Returns video ID and direct upload URL
 */
export async function createBunnyVideo(title: string): Promise<UploadUrlResponse> {
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

        const videoData: CreateVideoResponse = await createResponse.json();
        const videoId = videoData.guid;

        console.log("[BUNNY] Video created:", videoId);

        // Step 2: Return upload URL for direct upload
        const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;

        return {
            videoId,
            uploadUrl,
        };
    } catch (error) {
        console.error("[BUNNY] Error creating video:", error);
        throw error;
    }
}

/**
 * Upload video file directly to Bunny.net
 * Uses server-side authentication for secure upload
 */
export async function uploadVideoToBunny(
    videoId: string,
    fileData: Buffer | Blob
): Promise<void> {
    try {
        const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": BUNNY_API_KEY,
                "Content-Type": "application/octet-stream",
            },
            body: fileData,
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            console.error("[BUNNY] Upload failed:", error);
            throw new Error("Failed to upload video to Bunny.net");
        }

        console.log("[BUNNY] Upload complete:", videoId);
    } catch (error) {
        console.error("[BUNNY] Error uploading video:", error);
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
