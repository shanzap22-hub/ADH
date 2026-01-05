import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { fileName, fileSize } = await req.json();

        if (!fileName) {
            return NextResponse.json(
                { error: "File name is required" },
                { status: 400 }
            );
        }

        const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
        const apiKey = process.env.BUNNY_API_KEY;

        if (!libraryId || !apiKey) {
            console.error("[BUNNY_UPLOAD_URL] Missing environment variables");
            return NextResponse.json(
                { error: "Bunny.net configuration missing" },
                { status: 500 }
            );
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
            console.error("[BUNNY_UPLOAD_URL] Failed to create video:", errorText);
            return NextResponse.json(
                { error: "Failed to create video in Bunny.net" },
                { status: 500 }
            );
        }

        const videoData = await createVideoResponse.json();
        const videoId = videoData.guid;

        // Generate TUS upload URL
        const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

        console.log("[BUNNY_UPLOAD_URL] Video created successfully:", videoId);

        return NextResponse.json({
            videoId,
            uploadUrl,
            libraryId,
        });

    } catch (error: any) {
        console.error("[BUNNY_UPLOAD_URL] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
