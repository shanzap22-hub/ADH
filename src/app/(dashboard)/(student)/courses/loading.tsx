import { CoursesListSkeleton } from "@/components/skeletons/course-card-skeleton";

export default function CoursesLoading() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <CoursesListSkeleton count={8} />
        </div>
    );
}
