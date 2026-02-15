'use server';

import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function getMindMaps() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching mind maps:', error);
        return [];
    }

    return data;
}

export async function getMindMap(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching mind map:', error);
        return null;
    }

    return data;
}

export async function createMindMap(title: string = 'Untitled Mind Map') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Default root node
    const defaultContent = {
        nodes: [
            {
                id: 'root',
                type: 'mindMap',
                data: { label: 'Central Topic' },
                position: { x: 0, y: 0 },
            },
        ],
        edges: [],
    };

    const { data, error } = await supabase
        .from('mind_maps')
        .insert({
            user_id: user.id,
            title,
            content: defaultContent,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating mind map:', error);
        throw new Error('Failed to create mind map');
    }

    revalidatePath('/instructor/mind-maps');
    return data;
}

export async function updateMindMap(id: string, content: any, title?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const updateData: any = {
        content,
        updated_at: new Date().toISOString(),
    };

    if (title) {
        updateData.title = title;
    }

    const { error } = await supabase
        .from('mind_maps')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating mind map:', error);
        throw new Error('Failed to update mind map');
    }

    revalidatePath(`/instructor/mind-maps/${id}`);
}

export async function deleteMindMap(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('mind_maps')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting mind map:', error);
        throw new Error('Failed to delete mind map');
    }

    revalidatePath('/instructor/mind-maps');
}

export async function generateMindMapFromAI(topic: string) {
    if (!apiKey) {
        console.error("Gemini API Key is missing");
        throw new Error("AI Service Unavailable: Missing API Key");
    }

    try {
        console.log(`Generating mind map for topic: ${topic}`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Create a hierarchical mind map structure for the topic: "${topic}".
        Return ONLY a JSON object with the following structure:
        {
          "root": {
            "label": "Main Topic",
            "children": [
              {
                "label": "Subtopic 1",
                "children": [ ... ]
              },
              ...
            ]
          }
        }
        The structure should be balanced and have at least 3 levels of depth.
        Do not include any markdown formatting or code blocks, just raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Clean up markdown code blocks if present (Gemini sometimes adds them despite instructions)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error("Error generating mind map:", error);
        throw new Error(`Failed to generate mind map from AI: ${error.message}`);
    }
}
