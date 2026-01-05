import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const videoId = searchParams.get("videoId");

        if (!videoId) {
            return NextResponse.json(
                { error: "Video ID is required" },
                { status: 400 }
            );
        }

        const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
        const apiKey = process.env.BUNNY_API_KEY;

        if (!libraryId || !apiKey) {
            console.error("[BUNNY_VIDEO_STATUS] Missing environment variables");
            return NextResponse.json(
                { error: "Bunny.net configuration missing" },
                { status: 500 }
            );
        }

        // Get video details from Bunny.net
        const response = await fetch(
            `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
            {
                headers: {
                    "AccessKey": apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[BUNNY_VIDEO_STATUS] Failed to get video status:", errorText);
            return NextResponse.json(
                { error: "Failed to get video status from Bunny.net" },
                { status: 500 }
            );
        }

        const videoData = await response.json();

        // Bunny.net status codes:
        // 0 = Queued, 1 = Processing, 2 = Encoding, 3 = Finished, 4 = Resolution Finished, 5 = Failed
        const statusMap: Record<number, string> = {
            0: "processing",
            1: "processing",
            2: "processing",
            3: "ready",
            4: "ready",
            5: "failed",
        };

        const status = statusMap[videoData.status] || "processing";

        return NextResponse.json({
            videoId,
            status,
            title: videoData.title,
            duration: videoData.length,
            thumbnail: videoData.thumbnailFileName
                ? `https://vz-${videoData.storageZoneName || libraryId}.b-cdn.net/${videoId}/${videoData.thumbnailFileName}`
                : null,
            embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
        });

    } catch (error: any) {
        console.error("[BUNNY_VIDEO_STATUS] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to check video status" },
            { status: 500 }
        );
    }
}
