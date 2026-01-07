import Link from "next/link";
import Image from "next/image";
import { BookOpen, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteCourseDialog } from "@/components/delete-course-dialog";

interface InstructorCourseCardProps {
    id: string;
    title: string;
    imageUrl: string | null;
    chaptersLength: number;
    price: number;
    isPublished: boolean;
}

export const InstructorCourseCard = ({
    id,
    title,
    imageUrl,
    chaptersLength,
    price,
    isPublished,
}: InstructorCourseCardProps) => {
    return (
        <div className="group relative">
            <Link href={`/instructor/courses/${id}`}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10 h-full">
                    {/* Image */}
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                        {imageUrl ? (
                            <Image
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                alt={title}
                                src={imageUrl}
                                onError={(e) => {
                                    // Hide broken image, show fallback
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : null}

                        {/* Fallback icon for missing/broken images */}
                        {!imageUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="h-16 w-16 text-slate-600" />
                            </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                        {/* Status badge */}
                        <div className="absolute top-3 right-3">
                            <Badge className={isPublished ? "bg-green-500/90 backdrop-blur-sm hover:bg-green-600" : "bg-slate-600/90 backdrop-blur-sm hover:bg-slate-700"}>
                                {isPublished ? (
                                    <><Eye className="h-3 w-3 mr-1" /> Published</>
                                ) : (
                                    <><Edit className="h-3 w-3 mr-1" /> Draft</>
                                )}
                            </Badge>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight">
                            {title}
                        </h3>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-x-2 text-slate-400">
                                <BookOpen className="h-4 w-4 text-orange-400" />
                                <span className="font-medium">
                                    {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
                                </span>
                            </div>

                            <div className="text-white font-semibold">
                                {price === 0
                                    ? "Free"
                                    : new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(price)}
                            </div>
                        </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            </Link>
            <div className="absolute top-3 left-3 z-10">
                <DeleteCourseDialog courseId={id} courseTitle={title} />
            </div>
        </div>
    );
};
