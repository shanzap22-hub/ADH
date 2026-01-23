import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Use require for pdf-parse to avoid ESM/TS issues with this specific lib
const pdf = require("pdf-parse");

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
        const supabase = await createClient();

        // 1. Authenticate Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check if role is admin/instructor (via profiles or metadata)
        // For now trusting typical pattern or just checking auth.
        // Ideally: check user role from profiles table.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'instructor'].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string || file.name;

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        // Validate Size (20MB limit for docs)
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
        }

        // 3. Upload to BunnyCDN (Backup/Reference)
        const STORAGE_ZONE = (process.env.BUNNY_STORAGE_ZONE_NAME || '').replace('.b-cdn.net', '').trim();
        const ACCESS_KEY = process.env.BUNNY_STORAGE_API_KEY;
        let REGION = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();
        if (REGION === "singapore" || REGION === "asia") REGION = "sg";

        let fileUrl = null;

        if (STORAGE_ZONE && ACCESS_KEY) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filename = `knowledge/${Date.now()}-${Math.random().toString(36).slice(2)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const hostname = REGION === 'de' ? 'storage.bunnycdn.com' : `${REGION}.storage.bunnycdn.com`;
            const uploadUrl = `https://${hostname}/${STORAGE_ZONE}/${filename}`;

            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "AccessKey": ACCESS_KEY, "Content-Type": "application/octet-stream" },
                body: buffer,
            });

            if (uploadRes.ok) {
                const pullZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN || "adh-connect.b-cdn.net";
                fileUrl = `https://${pullZone}/${filename}`;
            } else {
                console.warn("Bunny upload failed, proceeding with processing only");
            }
        }

        // 4. Initial DB Insert
        const { data: doc, error: insertError } = await supabase
            .from('ai_knowledge_docs')
            .insert({
                title,
                file_url: fileUrl,
                file_type: file.type.includes('pdf') ? 'pdf' : 'text',
                status: 'processing'
            })
            .select()
            .single();

        if (insertError) throw new Error(insertError.message);

        // 5. Extract Text
        let fullText = "";
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        if (file.type.includes('pdf')) {
            const data = await pdf(fileBuffer);
            fullText = data.text;
        } else {
            // Assume text/plain or markdown
            fullText = fileBuffer.toString('utf-8');
        }

        // Clean text
        fullText = fullText.replace(/\s+/g, ' ').trim();
        const charCount = fullText.length;

        // 6. Chunk Text
        const chunks = simpleChunker(fullText);

        // 7. Generate Embeddings & Save
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        // Batch processing (Geneative AI has limits, let's do serial or small batch)
        // Gemini embedding-001 accepts batchEmbedContents or embedContent

        let successCount = 0;

        // Prepare batch insert data
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
                    embedding: embedding // pgvector accepts array directly via Supabase client? Usually yes.
                });

                successCount++;

                // Insert in batches of 10 to check progress/avoid huge payload
                if (vectorData.length >= 10) {
                    await supabase.from('ai_knowledge_vectors').insert(vectorData);
                    vectorData.length = 0; // clear
                }

            } catch (e: any) {
                console.error("Embedding generation failed for chunk", e.message);
                // Continue to next chunk
            }
        }

        // Final batch
        if (vectorData.length > 0) {
            await supabase.from('ai_knowledge_vectors').insert(vectorData);
        }

        // 8. Update Doc Status
        await supabase
            .from('ai_knowledge_docs')
            .update({
                status: 'ready',
                char_count: charCount
            })
            .eq('id', doc.id);

        return NextResponse.json({ success: true, docId: doc.id, chunks: successCount });

    } catch (error: any) {
        console.error("Knowledge Upload Error:", error);
        return NextResponse.json({ error: error.message || "Processing failed" }, { status: 500 });
    }
}
