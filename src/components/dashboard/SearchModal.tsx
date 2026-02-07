"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, Clock, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    id: string;
    title: string;
    description: string;
    type: "course" | "community" | "live";
    url: string;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Search functionality
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            console.log("[SearchModal] Searching for:", query);
            try {
                // Search courses
                const res = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`);
                console.log("[SearchModal] Response status:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("[SearchModal] Data received:", data);

                    const courseResults: SearchResult[] = data.courses?.map((course: any) => ({
                        id: course.id,
                        title: course.title,
                        description: course.description || "",
                        type: "course" as const,
                        url: `/courses/${course.id}`
                    })) || [];

                    console.log("[SearchModal] Mapped results:", courseResults.length);
                    setResults(courseResults);
                } else {
                    console.error("[SearchModal] Search failed:", await res.text());
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const handleResultClick = (url: string) => {
        router.push(url);
        onClose();
        setQuery("");
    };

    const handleClose = () => {
        onClose();
        setQuery("");
        setResults([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="p-0 gap-0 max-w-2xl">
                <VisuallyHidden>
                    <DialogTitle>Search</DialogTitle>
                </VisuallyHidden>

                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b">
                    <Search className="h-5 w-5 text-slate-400" />
                    <Input
                        autoFocus
                        placeholder="Search courses, community, and more..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-0 focus-visible:ring-0 text-base"
                    />
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Results */}
                <ScrollArea className="max-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-2">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result.url)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 rounded-md bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition">
                                            <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                                                {result.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                                {result.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.trim() ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No results found</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Try searching with different keywords
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Quick Links</h4>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleResultClick("/courses")}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 text-sm"
                                    >
                                        <BookOpen className="h-4 w-4 text-slate-400" />
                                        <span>Browse All Courses</span>
                                    </button>
                                    <button
                                        onClick={() => handleResultClick("/community")}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 text-sm"
                                    >
                                        <TrendingUp className="h-4 w-4 text-slate-400" />
                                        <span>Community Feed</span>
                                    </button>
                                    <button
                                        onClick={() => handleResultClick("/live")}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 text-sm"
                                    >
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span>Live Sessions</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
