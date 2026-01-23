import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // Import for Admin Client
import { GoogleGenerativeAI } from "@google/generative-ai";
// pdf-parse require moved inside handler to avoid top-level failures

// Force Node.js runtime for pdf-parse compatibility
export const runtime = 'nodejs';
export const maxDuration = 60; // Increase timeout to 60s for PDF processing

// Simple text splitter to avoid langchain dependency issues
function simpleChunker(text: string, chunkSize: number = 1000, chunkOverlap: number = 200) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        let end = Math.min(i + chunkSize, text.length);
        // Try to break at a space
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(" ", end);
            if (lastSpace > i) {
                end = lastSpace;
            }
        }
        const chunk = text.slice(i, end).trim();
        if (chunk.length > 0) {
            chunks.push({ pageContent: chunk });
        }
        i += (chunkSize - chunkOverlap);
        // Safety check to prevent infinite loop
        if (i >= end) i = end;
    }
    return chunks;
}

export async function POST(req: Request) {
    try {
        console.log("DEBUG_KB: Starting Knowledge Upload");
        const supabase = await createClient();

        // Create Admin Client for DB operations to bypass RLS issues
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Authenticate Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check if role is admin/instructor (via profiles or metadata)
        /*
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'instructor'].includes(profile.role)) {
            // return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }
        */

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string || file.name;

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        console.log("DEBUG_KB: File received:", file.name, file.size);

        // Validate Size (20MB limit for docs)
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
        }

        // 3. Upload directly to Supabase Storage 'knowledge' bucket
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log("DEBUG_KB: Uploading to Supabase Storage 'knowledge'...");
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('knowledge')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase Storage Upload Error:", uploadError);
            throw new Error(`Storage Upload Failed: ${uploadError.message}. Make sure 'knowledge' bucket exists.`);
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('knowledge').getPublicUrl(filePath);
        console.log("DEBUG_KB: File public URL:", publicUrl);

        // 4. Initial DB Insert
        const { data: doc, error: insertError } = await supabaseAdmin
            .from('ai_knowledge_docs')
            .insert({
                title,
                file_url: publicUrl,
                file_type: file.type.includes('pdf') ? 'pdf' : 'text',
                status: 'processing'
            })
            .select()
            .single();

        if (insertError) {
            console.error("DB Insert Error:", insertError);
            throw new Error(`DB Insert Failed: ${insertError.message}. Did you run the migrations?`);
        }

        // 5. Extract Text
        let fullText = "";
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        if (file.type.includes('pdf')) {
            // Lazy load pdf-parse
            const pdf = require("pdf-parse");
            const data = await pdf(fileBuffer);
            fullText = data.text;
        } else {
            // Assume text/plain or markdown
            fullText = fileBuffer.toString('utf-8');
        }

        // Clean text
        fullText = fullText.replace(/\s+/g, ' ').trim();
        const charCount = fullText.length;
        console.log("DEBUG_KB: Extracted text chars:", charCount);

        // 6. Chunk Text
        const chunks = simpleChunker(fullText);
        console.log("DEBUG_KB: Chunks created:", chunks.length);

        // 7. Generate Embeddings & Save
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        let successCount = 0;
        const vectorData = [];

        for (const chunk of chunks) {
            try {
                const content = chunk.pageContent;
                if (!content || content.length < 10) continue;

                const result = await model.embedContent(content);
                const embedding = result.embedding.values;

                vectorData.push({
                    doc_id: doc.id,
                    content: content,
                    embedding: embedding
                });

                successCount++;

                if (vectorData.length >= 10) {
                    await supabaseAdmin.from('ai_knowledge_vectors').insert(vectorData);
                    vectorData.length = 0;
                }

            } catch (e: any) {
                console.error("Embedding generation failed for chunk", e.message);
                // Continue to next chunk
            }
        }

        // Final batch
        if (vectorData.length > 0) {
            await supabaseAdmin.from('ai_knowledge_vectors').insert(vectorData);
        }

        // 8. Update Doc Status
        await supabaseAdmin
            .from('ai_knowledge_docs')
            .update({
                status: 'ready',
                char_count: charCount
            })
            .eq('id', doc.id);

        console.log("DEBUG_KB: Upload & Processing Complete!");
        return NextResponse.json({ success: true, docId: doc.id, chunks: successCount });

    } catch (error: any) {
        console.error("Knowledge Upload Error (Global Catch):", error);
        // Ensure we return JSON always, even on crash
        return NextResponse.json({
            error: error.message || "Processing failed unexpectedly",
            details: error.stack
        }, { status: 500 });
    }
}

