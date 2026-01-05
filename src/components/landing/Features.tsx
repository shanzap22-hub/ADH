import { Layers, Zap, Users, Shield, Smartphone, Globe } from "lucide-react";

const features = [
    {
        icon: Layers,
        title: "Course Builder",
        description: "Drag-and-drop course builder to create engaging lessons with video, quizzes, and assignments.",
    },
    {
        icon: Zap,
        title: "Instant Setup",
        description: "Launch your branded academy in minutes. No technical skills or hosting headaches required.",
    },
    {
        icon: Users,
        title: "Community Features",
        description: "Build a thriving community around your content with built-in discussions and memberships.",
    },
    {
        icon: Shield,
        title: "Secure Content",
        description: "Enterprise-grade security to protect your intellectual property and student data.",
    },
    {
        icon: Smartphone,
        title: "Mobile Friendly",
        description: "Your academy looks perfect on every device, ensuring a seamless learning experience anywhere.",
    },
    {
        icon: Globe,
        title: "Custom Domain",
        description: "Connect your own domain name to maintain full brand consistency and authority.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl">Everything You Need to Succeed</h2>
                    <p className="text-lg text-muted-foreground">
                        Powerful tools to create, market, and sell your online courses, all in one place.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-card p-8 rounded-xl border hover:shadow-lg transition-shadow duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
