import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInstructorNotes, createMasterNote } from "@/actions/master-notes";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const notes = await getInstructorNotes();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
                        Interactive Notes
                    </h1>
                    <p className="text-slate-400 mt-1">Manage shared notebook templates</p>
                </div>
                <form action={async () => {
                    'use server';
                    const newNote = await createMasterNote("Untitled Note");
                    redirect(`/instructor/notes/${newNote.id}`);
                }}>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/20">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Note
                    </Button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                    <Link key={note.id} href={`/instructor/notes/${note.id}`}>
                        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900/80 transition-all hover:border-blue-500/50 p-6 cursor-pointer h-full">
                            <div className="flex items-start justify-between">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${note.is_published
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                    }`}>
                                    {note.is_published ? "Published" : "Draft"}
                                </div>
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                                {note.title}
                            </h3>

                            <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                                {note.content || "Empty note..."}
                            </p>

                            <div className="mt-4 flex items-center text-xs text-slate-500">
                                <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {notes.length === 0 && (
                    <div className="col-span-full flex h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
                        <div className="text-center space-y-4">
                            <FileText className="h-12 w-12 text-slate-600 mx-auto" />
                            <div>
                                <p className="text-lg font-semibold text-slate-300">No notes created yet</p>
                                <p className="text-slate-500 mt-1">Create your first interactive note to share with students.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
