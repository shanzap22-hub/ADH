import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMasterNote } from "@/actions/master-notes";
import NoteEditor from "@/components/instructor/note-editor";

interface NoteIdPageProps {
    params: Promise<{
        noteId: string;
    }>;
}

export default async function NoteIdPage({
    params
}: NoteIdPageProps) {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const note = await getMasterNote(noteId);

    if (!note) {
        return redirect("/instructor/notes");
    }

    // Security check: Ensure instructor owns the note
    if (note.instructor_id !== user.id) {
        return redirect("/instructor/notes");
    }

    return (
        <NoteEditor note={note} />
    );
}
