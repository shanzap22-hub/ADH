"use client";

import { FileText, HelpCircle, Download, File } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ChapterTabsProps {
    chapterDescription: string | null;
    attachments?: { id: string; name: string; file_url: string }[];
}

export const ChapterTabs = ({
    chapterDescription,
    attachments = [],
}: ChapterTabsProps) => {
    return (
        <div className="p-4">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="qa" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Q&A
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Resources
                        {attachments.length > 0 && (
                            <span className="ml-1 bg-sky-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {attachments.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3">About this chapter</h3>
                        {chapterDescription ? (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {chapterDescription}
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 italic">
                                No description provided for this chapter.
                            </p>
                        )}
                    </div>
                </TabsContent>

                {/* Q&A Tab */}
                <TabsContent value="qa" className="mt-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3">Questions & Answers</h3>
                        <div className="text-center py-8 text-slate-500">
                            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Q&A feature coming soon!</p>
                            <p className="text-sm mt-2">Ask questions and get answers from instructors and peers.</p>
                        </div>
                    </div>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="mt-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3">Downloadable Resources</h3>
                        {attachments.length > 0 ? (
                            <div className="space-y-2">
                                {attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition"
                                    >
                                        <div className="flex items-center gap-x-3">
                                            <File className="h-8 w-8 text-sky-600" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {attachment.name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="ghost"
                                            className="hover:bg-sky-100 dark:hover:bg-sky-900"
                                        >
                                            <a
                                                href={attachment.file_url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Download className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No resources available yet.</p>
                                <p className="text-sm mt-2">Course materials and attachments will appear here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
