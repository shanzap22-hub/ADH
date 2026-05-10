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

        // 2. ക്യാഷ് MISS: പൂർണ്ണമായും സൗജന്യമായ Google Translate TTS ഉപയോഗിക്കുന്നു (No API Key Required)
        // 200 അക്ഷരങ്ങളിൽ താഴെയാണെങ്കിൽ ഒറ്റയടിക്ക് വർക്ക് ആകും. 
        // അഫർമേഷൻസ് സാധാരണയായി ചെറുതായതിനാൽ ഇത് കൃത്യമായി വർക്ക് ചെയ്യും.
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmedText)}&tl=ml&client=tw-ob`;

        const ttsResponse = await fetch(ttsUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!ttsResponse.ok) {
            console.error("Free TTS Error:", ttsResponse.statusText);
            return NextResponse.json({ error: "TTS generation failed" }, { status: 502 });
        }

        const arrayBuffer = await ttsResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // 3. Supabase Storage-ൽ ക്യാഷ് ചെയ്യുന്നു
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
            const audioBase64 = audioBuffer.toString('base64');
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
