import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            ADH CONNECT
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Empowering business owners with cutting-edge knowledge in social media marketing, AI automation, and personal branding.
                        </p>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>Palakkad, Kerala</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links - CRITICAL FOR RAZORPAY */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/privacy" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link href="/refund" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                <a href="mailto:info@atcess.com" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    info@atcess.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                <a href="tel:+917591977888" className="text-slate-400 hover:text-orange-400 transition text-sm">
                                    +91 7591977888
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-400 text-sm text-center md:text-left">
                            © {new Date().getFullYear()} Atcess. All rights reserved.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <Link href="/privacy" className="text-slate-400 hover:text-orange-400 transition">
                                Privacy
                            </Link>
                            <span className="text-slate-600">•</span>
                            <Link href="/terms" className="text-slate-400 hover:text-orange-400 transition">
                                Terms
                            </Link>
                            <span className="text-slate-600">•</span>
                            <Link href="/refund" className="text-slate-400 hover:text-orange-400 transition">
                                Refund
                            </Link>
                            <span className="text-slate-600">•</span>
                            <Link href="/contact" className="text-slate-400 hover:text-orange-400 transition">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
