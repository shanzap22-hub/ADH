import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, Target, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "About Us | ADH Connect",
    description: "Learn about ADH Connect, Kerala's first AI & Digital Marketing community dedicated to empowering business owners.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
                            <Heart className="w-4 h-4 fill-blue-400" />
                            <span>Built for Kerala's Entrepreneurs</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                            More Than Just a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Classroom.</span><br />
                            We Are a Movement.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                            ADH Connect isn't about selling courses. It's about giving business owners the power to control their own growth. No agencies, no excuses—just results.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Story / Problem Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900">Why We Started</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                                <p>
                                    It started with a simple observation: <strong>Business owners in Kerala were struggling.</strong>
                                </p>
                                <p>
                                    We saw amazing entrepreneurs with great products getting left behind because they didn't understand Digital Marketing. They were either burning money on ineffective ads or depending entirely on expensive agencies that didn't care about their bottom line.
                                </p>
                                <p>
                                    We realized that the only way to truly help was not to fish for them, but to <em>teach them how to fish.</em>
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-violet-100 rounded-2xl transform rotate-3" />
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                                <blockquote className="text-lg text-slate-700 italic">
                                    "Marketing is too important to be outsourced completely. As a founder, you need to understand the language of growth."
                                </blockquote>
                                <div className="mt-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">ADH Team</div>
                                        <div className="text-sm text-slate-500">Founders</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">What We Stand For</h2>
                        <p className="text-slate-600">We don't believe in "Get Rich Quick" schemes. We believe in building sustainable systems.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Practicality First</h3>
                            <p className="text-slate-600">
                                Theory is useless if you can't apply it. Our lessons are designed to be implemented immediately in your business.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Powered</h3>
                            <p className="text-slate-600">
                                The world is changing. We equip you with the latest AI tools to automate boring tasks and focus on strategy.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Community Led</h3>
                            <p className="text-slate-600">
                                You are never alone. Join hundreds of other Malayali business owners facing the same challenges as you.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                        Ready to take control?
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
                        Join ADH Connect today. Let's build something great together.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/courses">
                            <Button size="lg" className="rounded-full px-8 h-12 text-base">
                                Explore Courses <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                                Contact Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
