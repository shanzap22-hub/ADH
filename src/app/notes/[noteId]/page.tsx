import { redirect, notFound } from "next/navigation";
import { getMasterNote } from "@/actions/master-notes";
import StudentNoteView from "@/components/student-note-view";

interface NotePageProps {
    params: Promise<{
        noteId: string;
    }>;
}

export async function generateMetadata({ params }: NotePageProps) {
    const { noteId } = await params;
    const note = await getMasterNote(noteId);

    if (!note) {
        return {
            title: "Note Not Found",
        };
    }

    return {
        title: note.title,
        description: "Interactive shared note",
    };
}

export default async function NotePage({ params }: NotePageProps) {
    const { noteId } = await params;
    const note = await getMasterNote(noteId);

    if (!note) {
        return notFound();
    }

    if (!note.is_published) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Note not available</h1>
                    <p>This note is currently unpublished or does not exist.</p>
                </div>
            </div>
        );
    }

    return <StudentNoteView note={note} />;
}
