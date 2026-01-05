import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock, PlayCircle } from "lucide-react";

interface ChapterListStudentProps {
    items: {
        id: string;
        title: string;
        description: string | null;
        is_free: boolean;
        is_published: boolean;
        position: number;
    }[];
}

export const ChapterListStudent = ({
    items
}: ChapterListStudentProps) => {

    const sortedItems = [...items].sort((a, b) => a.position - b.position);

    return (
        <div className="flex flex-col gap-y-2">
            {sortedItems.map((chapter) => (
                <div
                    key={chapter.id}
                    className={cn(
                        "flex items-center gap-x-2 p-3 border rounded-md text-sm",
                        !chapter.is_published && "text-slate-500 italic"
                    )}
                >
                    <div className="flex items-center gap-x-2 flex-1">
                        {chapter.is_free ? (
                            <PlayCircle className="h-4 w-4 text-slate-500" />
                        ) : (
                            <Lock className="h-4 w-4 text-slate-500" />
                        )}
                        <span>{chapter.title}</span>
                        {chapter.is_free && (
                            <Badge variant="secondary">
                                Free Preview
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
            {items.length === 0 && (
                <div className="text-sm text-muted-foreground italic">
                    No chapters available yet.
                </div>
            )}
        </div>
    )
}
