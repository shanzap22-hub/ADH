import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-muted/30 border-t py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-xl font-bold mb-4">ADH Connect</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                            Empowering educators to share their knowledge with the world through modern technology.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Showcase</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Updates</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">About</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t">
                    <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                        © {new Date().getFullYear()} ADH Connect. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-muted-foreground hover:text-foreground bg-primary/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors">
                            <Twitter className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground bg-primary/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors">
                            <Github className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground bg-primary/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors">
                            <Linkedin className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
