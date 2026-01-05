import { NextRequest, NextResponse } from "next/server";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ videoId: string }> }
) {
    try {
        const { videoId } = await params;

        if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
            return NextResponse.json(
                { error: "Bunny.net configuration missing" },
                { status: 500 }
            );
        }

        // Get the file data from request body
        const fileData = await req.arrayBuffer();

        if (!fileData || fileData.byteLength === 0) {
            return NextResponse.json(
                { error: "No file data provided" },
                { status: 400 }
            );
        }

        console.log(`[BUNNY_UPLOAD] Uploading ${fileData.byteLength} bytes for video ${videoId}`);

        // Upload to Bunny.net
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
            const errorText = await uploadResponse.text();
            console.error(`[BUNNY_UPLOAD] Upload failed:`, errorText);
            return NextResponse.json(
                { error: "Failed to upload video to Bunny.net" },
                { status: uploadResponse.status }
            );
        }

        console.log(`[BUNNY_UPLOAD] Upload successful for video ${videoId}`);

        return NextResponse.json({
            success: true,
            videoId,
        });

    } catch (error: any) {
        console.error("[BUNNY_UPLOAD] Error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
