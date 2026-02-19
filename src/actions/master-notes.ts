'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type MasterNote = {
    id: string;
    title: string;
    content: string;
    instructor_id: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
};

export async function getInstructorNotes() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('master_notes')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notes:", error);
        throw new Error("Failed to fetch notes");
    }

    return data as MasterNote[];
}

export async function getMasterNote(noteId: string) {
    const supabase = await createClient();

    // Attempt to get the note.
    const { data, error } = await supabase
        .from('master_notes')
        .select('*')
        .eq('id', noteId)
        .single();

    if (error) {
        return null;
    }

    return data as MasterNote;
}

export async function createMasterNote(title: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('master_notes')
        .insert([
            {
                title,
                instructor_id: user.id,
                content: 'Write your template here...',
                is_published: false
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating note:", error);
        throw new Error("Failed to create note");
    }

    revalidatePath('/instructor/notes');
    return data as MasterNote;
}

export async function updateMasterNote(noteId: string, updates: Partial<MasterNote>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Security check: Ensure the user owns the note
    const { data: existingNote } = await supabase
        .from('master_notes')
        .select('instructor_id')
        .eq('id', noteId)
        .single();

    if (!existingNote || existingNote.instructor_id !== user.id) {
        throw new Error("Unauthorized access to this note");
    }

    const { data, error } = await supabase
        .from('master_notes')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

    if (error) {
        console.error("Error updating note:", error);
        throw new Error("Failed to update note");
    }

    // Revalidate paths
    revalidatePath(`/instructor/notes/${noteId}`);
    revalidatePath(`/notes/${noteId}`); // Revalidate public view

    return data as MasterNote;
}

export async function deleteMasterNote(noteId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('master_notes')
        .delete()
        .eq('id', noteId)
        .eq('instructor_id', user.id);

    if (error) {
        console.error("Error deleting note:", error);
        throw new Error("Failed to delete note");
    }

    revalidatePath('/instructor/notes');
}
