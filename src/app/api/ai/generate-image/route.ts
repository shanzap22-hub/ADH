import { NextResponse } from 'next/server';
import { uploadToBunny } from '@/actions/bunny';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            return NextResponse.json({ error: 'Cloudflare credentials missing' }, { status: 500 });
        }

        // Call Cloudflare Workers AI - FLUX.1-schnell
        // https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    num_steps: 4 // Schnell is fast (1-4 steps recommended)
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cloudflare AI Error:', response.status, errorText);
            return NextResponse.json({ error: `Cloudflare AI failed: ${errorText}` }, { status: response.status });
        }

        const result = await response.json();

        // Flux output is typically base64 in the result object
        // "result": { "image": "base64STRING..." }
        if (!result.success || !result.result || !result.result.image) {
            console.error('Cloudflare AI Unexpected Response:', result);
            return NextResponse.json({ error: 'Failed to generate image data' }, { status: 500 });
        }

        const base64Image = result.result.image;
        const buffer = Buffer.from(base64Image, 'base64');

        // Convert to FormData for uploadToBunny
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('file', blob, `ai-generated-${Date.now()}.jpg`);

        const uploadResult = await uploadToBunny(formData, 'mindmap-ai');

        if (uploadResult.error) {
            return NextResponse.json({ error: uploadResult.error }, { status: 500 });
        }

        return NextResponse.json({ url: uploadResult.url });

    } catch (error) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
