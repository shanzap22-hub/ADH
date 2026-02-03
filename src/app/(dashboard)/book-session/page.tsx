import { StudentBookingSystem } from "@/components/booking/StudentBookingSystem";
import { GoBackButton } from "@/components/ui/go-back-button";

export const metadata = {
    title: "Book Mentorship | ADH Connect",
    description: "Schedule your 1-on-1 mentorship session.",
};

export default function BookSessionPage() {
    return (
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Book 1-on-1 Session</h1>
                <p className="text-slate-500">
                    Select a mentor, choose a date, and pick a time slot that works for you.
                </p>
            </div>

            <StudentBookingSystem />
        </div>
    );
}
