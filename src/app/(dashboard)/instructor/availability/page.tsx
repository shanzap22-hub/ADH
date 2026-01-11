import { AvailabilityManager } from "@/components/booking/AvailabilityManager";

export default function AvailabilityPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Availability Settings</h1>
            <AvailabilityManager />
        </div>
    );
}
