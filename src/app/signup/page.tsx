import { redirect } from "next/navigation";

export default function SignupPage() {
    // Redirect to homepage - signup only through payment
    redirect("/");
}
