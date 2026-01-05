import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
    return (
        <section className="relative pt-24 pb-32 overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                        The Future of Learning is Here
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Launch Your Online Academy in Minutes
                    </h1>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        ADH LMS provides everything you need to create, market, and sell your courses.
                        No coding required. just pure teaching.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button size="lg" className="h-12 px-8 text-lg rounded-full" asChild>
                            <Link href="/signup">
                                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full" asChild>
                            <Link href="/demo">
                                Book a Demo
                            </Link>
                        </Button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>14-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>

                {/* Placeholder for Hero Image/Dashboard Preview */}
                <div className="mt-20 relative mx-auto max-w-5xl rounded-xl border bg-card p-2 shadow-2xl">
                    <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                        <p className="text-muted-foreground font-medium">Dashboard Preview Image</p>
                    </div>
                </div>
            </div>

            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
                <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
            </div>
        </section>
    );
}
