import { redirect } from "next/navigation";

// 2026 Performance: 5-minute cache for redirect
export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default function SearchPage() {
    return redirect("/dashboard");
}
