
import { CourseCard } from "@/components/course-card";

type CourseWithProgressWithCategory = {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
    category: { name: string } | null;
    chapters: { id: string }[];
    progress: number | null;
};

interface CoursesListProps {
    items: CourseWithProgressWithCategory[];
}

export const CoursesList = ({
    items
}: CoursesListProps) => {
    // Defensive check
    if (!items || !Array.isArray(items)) {
        console.error("[COURSES_LIST] Invalid items prop:", items);
        return (
            <div className="text-center text-sm text-red-600 mt-10 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                Error loading courses. Please refresh the page.
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => {
                    // Defensive check for each item
                    if (!item || !item.id) {
                        console.error("[COURSES_LIST] Invalid course item:", item);
                        return null;
                    }

                    return (
                        <CourseCard
                            key={item.id}
                            id={item.id}
                            title={item.title || "Untitled Course"}
                            imageUrl={item.image_url || "/placeholder-course.jpg"}
                            chaptersLength={item.chapters?.length || 0}
                            price={item.price || 0}
                            progress={item.progress}
                            category={item.category?.name || "General"}
                        />
                    );
                })}
            </div>
            {items.length === 0 && (
                <div className="text-center text-sm text-muted-foreground mt-10">
                    No courses found
                </div>
            )}
        </div>
    )
}
