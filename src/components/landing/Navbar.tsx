import Link from "next/link";
import Image from "next/image"; // Import Image
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/logo.png"
                            alt="ADH Connect"
                            width={160}
                            height={40}
                            className="h-9 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-foreground transition-colors">
                        Features
                    </Link>
                    <Link href="#pricing" className="hover:text-foreground transition-colors">
                        Pricing
                    </Link>
                    <Link href="#about" className="hover:text-foreground transition-colors">
                        About
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:block text-sm font-medium hover:underline underline-offset-4">
                        Login
                    </Link>
                    <Button size="sm" className="font-semibold">
                        Get Started
                    </Button>
                </div>
            </div>
        </header>
    );
}
