import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Supabase Service Role Client (ഇത് Server-Only, ക്ലൈന്റിൽ ഉപയോഗിക്കരുത്)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { text, lang = "ml-IN" } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // ടെക്സ്റ്റ് 500 അക്ഷരത്തിൽ കൂടരുത് (Google TTS limit)
        const trimmedText = text.slice(0, 4500);

        // കണ്ടൻ്റ് ഹാഷ് ഉണ്ടാക്കി ക്യാഷ് ഫൈൽ നേം ഡിറ്റർമൈൻ ചെയ്യുന്നു
        const hash = crypto.createHash("md5").update(`${lang}:${trimmedText}`).digest("hex");
        const cacheFileName = `${hash}.mp3`;
        const cachePath = `cache/${cacheFileName}`;

        // 1. ക്യാഷ് ചെക്ക്: ഇതിനുമുൻപ് ഇത് ജനറേറ്റ് ചെയ്തിട്ടുണ്ടോ?
        const { data: cachedFile } = await supabaseAdmin.storage
            .from("tts-cache")
            .list("cache", { search: cacheFileName });

        if (cachedFile && cachedFile.length > 0) {
            // ക്യാഷ് HIT: Public URL നൽകുന്നു
            const { data: publicUrl } = supabaseAdmin.storage
                .from("tts-cache")
                .getPublicUrl(cachePath);

            return NextResponse.json({ audioUrl: publicUrl.publicUrl, cached: true });
        }

        // 2. ക്യാഷ് MISS: Google Cloud TTS API-ൽ നിന്ന് ഓഡിയോ ജനറേറ്റ് ചെയ്യുന്നു
        const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "TTS API key not configured" }, { status: 500 });
        }

        const ttsResponse = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: { text: trimmedText },
                    voice: {
                        languageCode: lang,
                        // Malayalam-ന് WaveNet ശബ്ദം ഉപയോഗിക്കുന്നു (ഏറ്റവും മികച്ചത്)
                        name: lang === "ml-IN" ? "ml-IN-Wavenet-A" : "en-US-Neural2-F",
                        ssmlGender: "FEMALE"
                    },
                    audioConfig: {
                        audioEncoding: "MP3",
                        speakingRate: 0.9, // അല്പം പതുക്കെ, കൂടുതൽ വ്യക്തം
                        pitch: 0,
                        volumeGainDb: 0
                    }
                })
            }
        );

        if (!ttsResponse.ok) {
            const errorData = await ttsResponse.json();
            console.error("Google TTS Error:", errorData);
            return NextResponse.json(
                { error: "TTS generation failed", details: errorData },
                { status: 502 }
            );
        }

        const ttsData = await ttsResponse.json();
        const audioBase64 = ttsData.audioContent;

        if (!audioBase64) {
            return NextResponse.json({ error: "No audio content received" }, { status: 502 });
        }

        // 3. Supabase Storage-ൽ ക്യാഷ് ചെയ്യുന്നു
        const audioBuffer = Buffer.from(audioBase64, "base64");
        const { error: uploadError } = await supabaseAdmin.storage
            .from("tts-cache")
            .upload(cachePath, audioBuffer, {
                contentType: "audio/mpeg",
                cacheControl: "31536000", // 1 വർഷം ക്യാഷ്
                upsert: true
            });

        if (uploadError) {
            console.error("Cache upload error:", uploadError);
            // ക്യാഷ് ഫെയ്ൽ ആയാലും ഓഡിയോ Base64 ആയി നൽകുന്നു
            return NextResponse.json({ audioBase64, cached: false });
        }

        // 4. Public URL നൽകുന്നു
        const { data: publicUrl } = supabaseAdmin.storage
            .from("tts-cache")
            .getPublicUrl(cachePath);

        return NextResponse.json({ audioUrl: publicUrl.publicUrl, cached: false });

    } catch (error) {
        console.error("TTS Route Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
