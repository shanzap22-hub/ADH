"use client";

import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function TestCalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-white">
            <h1 className="text-2xl font-bold mb-4">Calendar UI Test - Grid Layout</h1>
            <div className="border rounded-lg shadow-xl p-4 max-w-sm mx-auto">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                        available: [new Date(), new Date(new Date().setDate(new Date().getDate() + 2))]
                    }}
                    modifiersClassNames={{
                        available: "bg-green-100 text-green-700 font-bold hover:bg-green-200 rounded-full"
                    }}
                />
                <style jsx global>{`
                    .rdp-month_grid { display: table !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
                    .rdp-weekdays { display: table-row !important; }
                    .rdp-weekday { display: table-cell !important; width: 14.28% !important; text-align: center !important; font-size: 0.8rem !important; height: 2rem !important; vertical-align: middle !important; }
                    .rdp-weeks { display: table-row-group !important; }
                    .rdp-week { display: table-row !important; }
                    .rdp-day { display: table-cell !important; width: 14.28% !important; text-align: center !important; height: 2.25rem !important; vertical-align: middle !important; padding: 0 !important; }
                    td[role="gridcell"] { display: table-cell !important; width: 14.28% !important; padding: 0 !important; } 
                    .rdp-day_button { margin: 0 auto !important; width: 2rem !important; height: 2rem !important; border-radius: 9999px !important; }
                `}</style>
            </div>
        </div>
    );
}
