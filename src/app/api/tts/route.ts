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

        // 2. ക്യാഷ് MISS: Backend Chunking & Concatenation
        const chunks = trimmedText.match(/.{1,150}(?:\s|$)|.{1,150}/g) || [trimmedText];
        const audioBuffers: Buffer[] = [];

        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const langCode = lang.split('-')[0] || 'ml';
            const urlGtx = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=${langCode}&client=gtx`;
            const urlTwob = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=${langCode}&client=tw-ob`;

            let response = await fetch(urlGtx, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            });

            if (!response.ok) {
                // Fallback if gtx is blocked
                response = await fetch(urlTwob, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                });
            }

            if (!response.ok) {
                console.error("Free TTS Error:", response.statusText, response.status);
                throw new Error("TTS generation failed for chunk");
            }

            const arrayBuffer = await response.arrayBuffer();
            audioBuffers.push(Buffer.from(arrayBuffer));
            
            // Add a small delay to prevent rate limits
            await new Promise(r => setTimeout(r, 300));
        }

        if (audioBuffers.length === 0) throw new Error("No audio generated");

        const combinedBuffer = Buffer.concat(audioBuffers);
        const audioBase64 = combinedBuffer.toString('base64');

        // 3. Supabase-ൽ സ്റ്റോർ ചെയ്യുന്നു
        try {
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('tts-cache')
                .upload(cachePath, combinedBuffer, {
                    contentType: 'audio/mpeg',
                    upsert: true
                });

            if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin.storage.from('tts-cache').getPublicUrl(cachePath);
                return NextResponse.json({ audioUrl: publicUrl, audioBase64, cached: false });
            }
        } catch (storageError) {
            console.error("Storage cache error:", storageError);
            // Cache failed, but we still return base64
        }

        return NextResponse.json({ audioBase64, cached: false });

    } catch (error) {
        console.error("TTS Route Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
