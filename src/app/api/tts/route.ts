import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Edge Runtime കോൺഫിഗറേഷൻ (ഇതിലൂടെ idle wait ടൈം ഫ്രീ ആകും)
export const runtime = 'edge';

// Supabase Service Role Client (Edge Runtime-ൽ 100% കോംപാറ്റിബിൾ ആണ്)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Web Crypto API ഉപയോഗിച്ച് സുരക്ഷിതമായ SHA-256 ജനറേറ്റ് ചെയ്യാനുള്ള ഹെൽപ്പർ ഫംഗ്ഷൻ (Node crypto ഡിപെൻഡൻസി ഒഴിവാക്കാൻ)
async function generateSHA256Hash(text: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Uint8Array ബൈനറി ഡാറ്റയെ Web Standard അനുസരിച്ച് Base64-ലേക്ക് മാറ്റാനുള്ള ഹെൽപ്പർ
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = "";
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

export async function POST(req: NextRequest) {
    try {
        const { text, lang = "ml-IN" } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // ടെക്സ്റ്റ് ലിമിറ്റ് (Google TTS പരിധിക്ക് ഉള്ളിൽ നിർത്താൻ)
        const trimmedText = text.slice(0, 4500);

        // ക്യാഷ് ഫയലിനായി യുണീക്ക് SHA-256 ഹാഷ് നിർമ്മിക്കുന്നു
        const hash = await generateSHA256Hash(`${lang}:${trimmedText}`);
        const cacheFileName = `${hash}.mp3`;
        const cachePath = `cache/${cacheFileName}`;

        // 1. ക്യാഷ് പരിശോധന: മുൻപ് ഇത് ജനറേറ്റ് ചെയ്തിട്ടുണ്ടോ?
        const { data: cachedFile } = await supabaseAdmin.storage
            .from("tts-cache")
            .list("cache", { search: cacheFileName });

        if (cachedFile && cachedFile.length > 0) {
            // ക്യാഷ് HIT: പബ്ലിക് URL നേരിട്ട് നൽകുന്നു (പ്രോസസ്സിംഗ് സമയം < 100ms)
            const { data: publicUrl } = supabaseAdmin.storage
                .from("tts-cache")
                .getPublicUrl(cachePath);

            return NextResponse.json({ audioUrl: publicUrl.publicUrl, cached: true });
        }

        // 2. ക്യാഷ് MISS: ഗൂഗിൾ TTS വഴി ഓഡിയോ ജനറേറ്റ് ചെയ്യുന്നു
        const chunks = trimmedText.match(/.{1,150}(?:\s|$)|.{1,150}/g) || [trimmedText];
        const audioBuffers: Uint8Array[] = [];

        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const langCode = lang.split('-')[0] || 'ml';
            const urlGtx = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=${langCode}&client=gtx`;
            const urlTwob = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=${langCode}&client=tw-ob`;

            let response = await fetch(urlGtx, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            });

            if (!response.ok) {
                // gtx തടയപ്പെട്ടാൽ രണ്ടാമത്തെ ലിങ്ക് വഴി ശ്രമിക്കുന്നു (Fallback)
                response = await fetch(urlTwob, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                });
            }

            if (!response.ok) {
                console.error("Free TTS Error:", response.statusText, response.status);
                throw new Error("TTS generation failed for chunk");
            }

            const arrayBuffer = await response.arrayBuffer();
            audioBuffers.push(new Uint8Array(arrayBuffer));
            
            // ഗൂഗിൾ നമ്മളെ ബ്ലോക്ക് ചെയ്യാതിരിക്കാൻ താങ്കൾ സെറ്റ് ചെയ്ത 300ms ഡിലേ അങ്ങനെ തന്നെ നിലനിർത്തുന്നു
            await new Promise(r => setTimeout(r, 300));
        }

        if (audioBuffers.length === 0) throw new Error("No audio generated");

        // Uint8Array-കൾ പരസ്പരം യോജിപ്പിച്ച് ഒരൊറ്റ ഫയൽ ഡാറ്റ ഉണ്ടാക്കുന്നു (Node Buffer ഒഴിവാക്കാൻ)
        let totalLength = 0;
        for (const arr of audioBuffers) {
            totalLength += arr.length;
        }
        const combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of audioBuffers) {
            combinedBuffer.set(arr, offset);
            offset += arr.length;
        }

        // ബൈനറിയെ സുരക്ഷിതമായി Base64 സ്ട്രിംഗിലേക്ക് മാറ്റുന്നു
        const audioBase64 = uint8ArrayToBase64(combinedBuffer);

        // 3. ജനറേറ്റ് ചെയ്ത പുതിയ ഓഡിയോ ക്യാഷ് ചെയ്യാനായി സുപബേസിലേക്ക് അപ്‌ലോഡ് ചെയ്യുന്നു
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
        }

        return NextResponse.json({ audioBase64, cached: false });

    } catch (error) {
        console.error("TTS Route Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
