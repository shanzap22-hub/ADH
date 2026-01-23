"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Redirect {
    id: string;
    slug: string;
    destination: string;
    clicks: number;
    created_at: string;
}

export function RedirectsClient({ initialRedirects }: { initialRedirects: Redirect[] }) {
    const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newSlug, setNewSlug] = useState("");
    const [newDest, setNewDest] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const supabase = createClient();
    const router = useRouter();

    const handleCreate = async () => {
        if (!newSlug || !newDest) {
            toast.error("Please fill both fields");
            return;
        }

        setLoading(true);
        // Clean slug
        const cleanSlug = newSlug.trim().replace(/^\//, '').replace(/\s+/g, '-').toLowerCase();

        try {
            const { data, error } = await supabase
                .from('redirects')
                .insert({
                    slug: cleanSlug,
                    destination: newDest
                })
                .select()
                .single();

            if (error) throw error;

            setRedirects([data, ...redirects]);
            toast.success("Redirect link created!");
            setIsOpen(false);
            setNewSlug("");
            setNewDest("");
            router.refresh();
        } catch (error: any) {
            toast.error("Failed to create", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this link?")) return;

        try {
            const { error } = await supabase.from('redirects').delete().eq('id', id);
            if (error) throw error;

            setRedirects(redirects.filter(r => r.id !== id));
            toast.success("Deleted successfully");
            router.refresh();
        } catch (error: any) {
            toast.error("Delete failed", { description: error.message });
        }
    };

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Copied to clipboard!");
    };

    const filtered = redirects.filter(r =>
        r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search links..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            New Redirect Link
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Short Link</DialogTitle>
                            <DialogDescription>
                                Enter the path (slug) and the target URL.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Path</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">adh.today/</span>
                                    <Input
                                        placeholder="offer"
                                        value={newSlug}
                                        onChange={(e) => setNewSlug(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target URL</label>
                                <Input
                                    placeholder="https://youtube.com/..."
                                    value={newDest}
                                    onChange={(e) => setNewDest(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={loading} className="bg-orange-500 text-white">
                                {loading ? "Creating..." : "Create Link"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Short Link</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                    No redirects found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-orange-600">/{r.slug}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(r.slug)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={r.destination}>
                                        <a href={r.destination} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline text-slate-600">
                                            {r.destination}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(r.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
