"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, FileText, Loader2, Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Doc {
    id: string;
    title: string;
    status: string;
    file_type: string;
    char_count: number;
    created_at: string;
}

export function KnowledgeManager({ docs }: { docs: Doc[] }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fileInput = form.elements.namedItem('file') as HTMLInputElement;

        if (!fileInput.files?.length) return;

        setUploading(true);
        const formData = new FormData(form);

        try {
            const res = await fetch('/api/admin/knowledge/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Upload failed");

            toast.success("Document uploaded successfully", {
                description: `Processed ${data.chunks || 0} chunks from the file.`
            });
            form.reset();
            router.refresh();
        } catch (error: any) {
            toast.error("Upload Failed", { description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the document and all its learned contexts.")) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/knowledge/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Delete failed");

            toast.success("Document deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete document");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Content</CardTitle>
                    <CardDescription>Upload PDF or Text files to train the AI (Max 20MB)</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                name="title"
                                placeholder="Document Title (e.g. Chapter 1 Notes)"
                                required
                            />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                name="file"
                                type="file"
                                accept=".pdf,.txt,.md"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload & Train
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Knowledge Base ({docs.length})</CardTitle>
                    <CardDescription>Documents currently used by the AI for answers</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size (Chars)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No documents found. Upload one to start.
                                    </TableCell>
                                </TableRow>
                            )}
                            {docs.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            {doc.title}
                                        </div>
                                    </TableCell>
                                    <TableCell className="uppercase text-xs">{doc.file_type}</TableCell>
                                    <TableCell>{doc.char_count.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {doc.status === 'ready' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                            {doc.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                            {doc.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                            <span className="capitalize">{doc.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={deleting === doc.id}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
