import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function SignupPage() {
    // Redirect to homepage - signup only through payment
    redirect("/");
}
